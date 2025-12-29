import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Mail, Phone, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default async function ContractorLandlordsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'contractor') {
    return redirect('/');
  }

  // Get all landlord relationships
  const contractors = await prisma.contractor.findMany({
    where: { userId: session.user.id },
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          companyName: true,
          companyEmail: true,
          companyPhone: true,
          companyAddress: true,
          _count: {
            select: { properties: true }
          }
        }
      },
      _count: {
        select: { workOrders: true }
      },
      workOrders: {
        where: { status: 'completed' },
        select: { agreedPrice: true, actualCost: true }
      }
    },
  });

  // Calculate earnings per landlord
  const landlordData = contractors.map(c => ({
    ...c,
    totalEarnings: c.workOrders.reduce((sum, wo) => 
      sum + Number(wo.actualCost || wo.agreedPrice || 0), 0
    )
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">My Landlords</h1>
          <p className="text-black/70 mt-1">Property managers you work with</p>
        </div>
        <Button variant="outline" className="border-white/20 bg-white/90 hover:bg-white text-black">
          <Plus className="h-4 w-4 mr-2" />
          Enter Invite Code
        </Button>
      </div>

      {landlordData.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-white/20">
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-700 text-lg">No landlord connections yet</p>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                Enter an invite code from a property manager to connect
              </p>
              <Button className="bg-violet-600 hover:bg-violet-500">
                <Plus className="h-4 w-4 mr-2" />
                Enter Invite Code
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {landlordData.map((contractor) => (
            <Card key={contractor.id} className="bg-white/90 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-black">
                        {contractor.landlord.companyName || contractor.landlord.name}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                        {contractor.landlord.companyEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {contractor.landlord.companyEmail}
                          </span>
                        )}
                        {contractor.landlord.companyPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {contractor.landlord.companyPhone}
                          </span>
                        )}
                      </div>
                      {contractor.landlord.companyAddress && (
                        <p className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                          <MapPin className="h-4 w-4" />
                          {contractor.landlord.companyAddress}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(contractor.totalEarnings)}
                    </p>
                    <p className="text-xs text-slate-500">Total Earned</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-200">
                  <div className="text-center">
                    <p className="text-xl font-bold text-black">{contractor._count.workOrders}</p>
                    <p className="text-xs text-slate-500">Total Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-black">{contractor.landlord._count.properties}</p>
                    <p className="text-xs text-slate-500">Properties</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-600">Active</p>
                    <p className="text-xs text-slate-500">Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Code Entry */}
      <Card className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 border-violet-500/20">
        <CardContent className="p-6">
          <h3 className="font-semibold text-black mb-2">Have an invite code?</h3>
          <p className="text-sm text-black/80 mb-4">
            Property managers can send you an invite code to connect. Enter it below to start receiving work orders.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter 6-character code"
              className="flex-1 px-4 py-2 rounded-lg bg-white/90 border border-white/20 text-black placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
            />
            <Button className="bg-violet-600 hover:bg-violet-500">
              Connect
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
