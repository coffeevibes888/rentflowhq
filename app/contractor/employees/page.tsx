import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Mail, Phone, Award, Clock } from 'lucide-react';
import Image from 'next/image';

export default async function EmployeesPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'contractor') {
    return redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!contractorProfile) {
    return redirect('/contractor/profile');
  }

  const employees = await prisma.contractorEmployee.findMany({
    where: { contractorId: contractorProfile.id },
    include: {
      _count: {
        select: {
          timeEntries: true,
          assignments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
  };

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/30 text-emerald-200',
    inactive: 'bg-gray-500/30 text-gray-200',
    terminated: 'bg-red-500/30 text-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Team Members</h1>
          <p className="text-white/70 mt-1">Manage your employees and contractors</p>
        </div>
        <Link href="/contractor/employees/new">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-white/70">Total Team Members</p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-300">{stats.active}</p>
            <p className="text-sm text-white/70">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-300">{stats.inactive}</p>
            <p className="text-sm text-white/70">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 col-span-full">
            <CardContent className="p-12 text-center">
              <p className="text-white/70 text-lg mb-4">No team members yet</p>
              <Link href="/contractor/employees/new">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Employee
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          employees.map((employee) => (
            <Link
              key={employee.id}
              href={`/contractor/employees/${employee.id}`}
              className="block"
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {employee.photo ? (
                        <Image
                          src={employee.photo}
                          alt={`${employee.firstName} ${employee.lastName}`}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg truncate">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-sm text-white/60">{employee.role}</p>
                      <Badge className={`${statusColors[employee.status]} mt-2`}>
                        {employee.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {employee.email && (
                      <div className="flex items-center gap-2 text-white/60">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                    )}
                    {employee.phone && (
                      <div className="flex items-center gap-2 text-white/60">
                        <Phone className="h-3 w-3" />
                        <span>{employee.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                    <div>
                      <div className="flex items-center gap-1 text-white/60 text-xs mb-1">
                        <Clock className="h-3 w-3" />
                        <span>Jobs</span>
                      </div>
                      <p className="text-lg font-semibold text-white">
                        {employee._count.assignments}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-white/60 text-xs mb-1">
                        <Award className="h-3 w-3" />
                        <span>Rating</span>
                      </div>
                      <p className="text-lg font-semibold text-white">
                        {Number(employee.avgRating).toFixed(1)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
