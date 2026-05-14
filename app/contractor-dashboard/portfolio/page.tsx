import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Camera, Video, Upload, Image as ImageIcon, FolderOpen, Lightbulb } from 'lucide-react';

export default async function ContractorPortfolioPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'contractor') {
    return redirect('/');
  }

  const portfolioItems: any[] = [];

  return (
    <div className='w-full space-y-5'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-black'>My Work</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>Document your completed jobs with photos and videos</p>
        </div>
        <Button className='bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm font-semibold self-start'>
          <Upload className='h-4 w-4 mr-2' /> Upload Media
        </Button>
      </div>

      {/* Upload Options */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        {[
          { icon: Camera, label: 'Take Photo', desc: 'Capture work in progress', color: 'text-violet-500', bg: 'bg-violet-50' },
          { icon: Video, label: 'Record Video', desc: 'Show your process', color: 'text-blue-500', bg: 'bg-blue-50' },
          { icon: ImageIcon, label: 'Upload Images', desc: 'From your device', color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { icon: FolderOpen, label: 'Before/After', desc: 'Compare your work', color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map(({ icon: Icon, label, desc, color, bg }) => (
          <button key={label} className='flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md hover:border-amber-200 transition-all text-center'>
            <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className='text-xs font-semibold text-gray-800'>{label}</p>
            <p className='text-[10px] text-gray-500'>{desc}</p>
          </button>
        ))}
      </div>

      {/* Portfolio Grid */}
      <div className='rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-gray-100'>
          <h3 className='text-sm font-bold text-gray-800'>Work Documentation</h3>
        </div>
        {portfolioItems.length === 0 ? (
          <div className='p-10 text-center'>
            <div className='w-14 h-14 mx-auto mb-4 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center'>
              <Camera className='h-7 w-7 text-gray-300' />
            </div>
            <h3 className='text-base font-bold text-gray-800 mb-1'>No media uploaded yet</h3>
            <p className='text-sm text-gray-500 mb-4'>
              Upload photos and videos of your completed work to build your portfolio.
            </p>
            <Button className='bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold'>
              <Upload className='h-4 w-4 mr-2' /> Upload Your First Media
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4'>
            {portfolioItems.map((item) => (
              <div key={item.id} className='aspect-square rounded-xl bg-gray-100 overflow-hidden relative group border border-gray-200'>
                <img src={item.url} alt={item.title} className='w-full h-full object-cover' />
                <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                  <p className='text-white text-xs font-medium px-2 text-center'>{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className='flex items-start gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50'>
        <div className='p-1.5 rounded-lg bg-amber-100 shrink-0'>
          <Lightbulb className='h-4 w-4 text-amber-600' />
        </div>
        <div>
          <p className='text-xs font-semibold text-amber-800'>Documentation Tips</p>
          <ul className='text-xs text-amber-700 mt-1 space-y-0.5'>
            <li>• Take "before" photos when you arrive at a job</li>
            <li>• Document any existing damage or issues</li>
            <li>• Capture progress photos during the work</li>
            <li>• Take clear "after" photos showing completed work</li>
            <li>• Videos are great for showing complex repairs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
