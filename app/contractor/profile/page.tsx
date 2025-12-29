import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Briefcase, MapPin, Star, Shield, Camera } from 'lucide-react';

export default async function ContractorProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'contractor') {
    return redirect('/');
  }

  // Get user and contractor info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  const contractors = await prisma.contractor.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      specialties: true,
      notes: true,
    },
  });

  // Aggregate specialties
  const allSpecialties = [...new Set(contractors.flatMap(c => c.specialties || []))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-600 mt-1">Manage your public profile and branding</p>
      </div>

      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-white/20 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {user?.image ? (
                  <img src={user.image} alt={user.name || ''} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-white" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors">
                <Camera className="h-4 w-4 text-blue-600" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user?.name || 'Contractor'}</h2>
              <p className="text-white/80">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 rounded bg-white/20 text-white text-xs font-medium">
                  Verified Contractor
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-600">Business Name</label>
              <Input
                defaultValue={contractors[0]?.name || user?.name || ''}
                className="mt-1 bg-white border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Email</label>
              <Input
                defaultValue={user?.email || ''}
                className="mt-1 bg-slate-100 border-slate-200 text-slate-900"
                disabled
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Phone</label>
              <Input
                placeholder="(555) 123-4567"
                className="mt-1 bg-white border-slate-200 text-slate-900"
              />
            </div>
            <Button className="w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 hover:opacity-90">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Specialties */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-violet-600" />
              Specialties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Select the services you offer
            </p>
            <div className="flex flex-wrap gap-2">
              {['Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Painting', 'Roofing', 'Landscaping', 'General Repairs', 'Appliance Repair', 'Flooring'].map((specialty) => (
                <button
                  key={specialty}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    allSpecialties.includes(specialty)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Areas */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cyan-600" />
              Service Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Areas where you provide services
            </p>
            <Input
              placeholder="Enter city or zip code"
              className="bg-white border-slate-200 text-slate-900"
            />
          </CardContent>
        </Card>

        {/* Credentials */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-600">License Number</label>
              <Input
                placeholder="Enter your license number"
                className="mt-1 bg-white border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Insurance Provider</label>
              <Input
                placeholder="Enter insurance company"
                className="mt-1 bg-white border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Insurance Policy Number</label>
              <Input
                placeholder="Enter policy number"
                className="mt-1 bg-white border-slate-200 text-slate-900"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketplace Preview */}
      <Card className="bg-gradient-to-br from-violet-100 to-purple-100 border-violet-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Star className="h-8 w-8 text-violet-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Contractor Marketplace</h3>
              <p className="text-sm text-slate-600">
                Your profile will be visible to property managers in the contractor marketplace. 
                A complete profile with specialties, service areas, and credentials helps you get more jobs.
              </p>
              <Button variant="outline" className="mt-4 border-violet-300 text-violet-700 hover:bg-violet-50">
                Preview Public Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
