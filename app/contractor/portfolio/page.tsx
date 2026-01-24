import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Video, Upload, Image as ImageIcon, FolderOpen } from 'lucide-react';

export default async function ContractorPortfolioPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'contractor') {
    return redirect('/');
  }

  // TODO: Fetch portfolio items from database
  const portfolioItems: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Work</h1>
          <p className="text-slate-600 mt-1">Document your completed jobs with photos and videos</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-500">
          <Upload className="h-4 w-4 mr-2" />
          Upload Media
        </Button>
      </div>

      {/* Upload Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-gray-300 hover:border-violet-400/60 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <Camera className="h-10 w-10 mx-auto text-violet-600 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Take Photo</h3>
            <p className="text-xs text-slate-500">Capture work in progress</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-gray-300 hover:border-blue-400/60 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <Video className="h-10 w-10 mx-auto text-blue-600 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Record Video</h3>
            <p className="text-xs text-slate-500">Show your process</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-gray-300 hover:border-emerald-400/60 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <ImageIcon className="h-10 w-10 mx-auto text-emerald-600 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Upload Images</h3>
            <p className="text-xs text-slate-500">From your device</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-gray-300 hover:border-amber-400/60 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <FolderOpen className="h-10 w-10 mx-auto text-amber-600 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Before/After</h3>
            <p className="text-xs text-slate-500">Compare your work</p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Grid */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-300">
        <CardHeader>
          <CardTitle className="text-slate-900">Work Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolioItems.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">No media uploaded yet</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">
                Upload photos and videos of your completed work to build your portfolio
              </p>
              <Button className="bg-violet-600 hover:bg-violet-500">
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Media
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {portfolioItems.map((item) => (
                <div
                  key={item.id}
                  className="aspect-square rounded-lg bg-slate-100 overflow-hidden relative group"
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-gray-900 text-sm font-medium">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-gray-300 shadow-xl">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">📸 Documentation Tips</h3>
          <ul className="text-sm text-gray-900/90 space-y-2">
            <li>• Take "before" photos when you arrive at a job</li>
            <li>• Document any existing damage or issues</li>
            <li>• Capture progress photos during the work</li>
            <li>• Take clear "after" photos showing completed work</li>
            <li>• Videos are great for showing complex repairs</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
