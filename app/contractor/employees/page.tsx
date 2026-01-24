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
    active: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    inactive: 'bg-gray-100 text-gray-700 border-gray-300',
    terminated: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Team Members</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your employees and contractors</p>
        </div>
        <Link href="/contractor/employees/new">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-gray-900 border-2 border-black shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-600 mt-1">Total Team Members</p>
        </div>
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-emerald-600">{stats.active}</p>
          <p className="text-sm text-gray-600 mt-1">Active</p>
        </div>
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-gray-500">{stats.inactive}</p>
          <p className="text-sm text-gray-600 mt-1">Inactive</p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.length === 0 ? (
          <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm col-span-full">
            <div className="p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">No team members yet</p>
              <Link href="/contractor/employees/new">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-gray-900 border-2 border-black shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Employee
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          employees.map((employee) => (
            <Link
              key={employee.id}
              href={`/contractor/employees/${employee.id}`}
              className="block"
            >
              <div className="rounded-xl border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all h-full p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-blue-200">
                    {employee.photo ? (
                      <Image
                        src={employee.photo}
                        alt={`${employee.firstName} ${employee.lastName}`}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-blue-600">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{employee.role}</p>
                    <Badge className={`${statusColors[employee.status]} mt-2 border`}>
                      {employee.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
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
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t-2 border-gray-100">
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
          ))
        )}
      </div>
    </div>
  );
}
