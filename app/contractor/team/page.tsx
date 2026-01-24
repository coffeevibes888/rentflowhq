import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Users, 
  UserCheck, 
  Clock, 
  Award,
  Mail,
  Phone,
  Calendar,
  TrendingUp
} from 'lucide-react';
import Image from 'next/image';

export default async function TeamHubPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, businessName: true },
  });

  if (!contractorProfile) {
    redirect('/onboarding/contractor');
  }

  // Fetch employees with their data
  const employees = await prisma.contractorEmployee.findMany({
    where: { contractorId: contractorProfile.id },
    include: {
      assignedRole: {
        select: {
          name: true,
          permissions: true,
        },
      },
      _count: {
        select: {
          assignments: true,
          timeEntries: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate stats
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    onJobs: employees.filter(e => e.status === 'active' && e._count.assignments > 0).length,
    available: employees.filter(e => e.status === 'active' && e._count.assignments === 0).length,
  };

  // Get roles distribution
  const roleDistribution = employees.reduce((acc, emp) => {
    const role = emp.assignedRole?.name || emp.role;
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    inactive: 'bg-gray-100 text-gray-700 border-gray-300',
    terminated: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Team Hub</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your team and track performance</p>
        </div>
        <Link href="/contractor/team/new">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-2 border-black shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Team</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <Clock className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.onJobs}</p>
              <p className="text-sm text-gray-600">On Jobs</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-100">
              <TrendingUp className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
              <p className="text-sm text-gray-600">Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team by Role</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(roleDistribution).map(([role, count]) => (
              <div key={role} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        </div>
        <div className="p-5">
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 mb-4">No team members yet</p>
              <Link href="/contractor/team/new">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Team Member
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <Link
                  key={employee.id}
                  href={`/contractor/team/${employee.id}`}
                  className="block"
                >
                  <div className="rounded-lg border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-blue-200">
                        {employee.photo ? (
                          <Image
                            src={employee.photo}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            width={56}
                            height={56}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-blue-600">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {employee.firstName} {employee.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {employee.assignedRole?.name || employee.role}
                        </p>
                        <Badge className={`${statusColors[employee.status]} mt-1`}>
                          {employee.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      {employee.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{employee.email}</span>
                        </div>
                      )}
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>Hired {new Date(employee.hireDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-gray-100">
                      <div>
                        <div className="flex items-center gap-1 text-gray-600 text-xs mb-1">
                          <Clock className="h-3 w-3" />
                          <span>Jobs</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {employee._count.assignments}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-gray-600 text-xs mb-1">
                          <Award className="h-3 w-3" />
                          <span>Rating</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {Number(employee.avgRating).toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
