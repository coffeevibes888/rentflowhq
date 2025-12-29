import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Play, Square, MapPin } from 'lucide-react';

export default async function ContractorTimeTrackingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'contractor') {
    return redirect('/');
  }

  // TODO: Fetch time entries from database
  const timeEntries: any[] = [];
  const isClockIn = false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Time Tracking</h1>
        <p className="text-slate-600 mt-1">Log hours for hourly jobs</p>
      </div>

      {/* Clock In/Out Card */}
      <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-white/20 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isClockIn ? 'Currently Working' : 'Not Clocked In'}
                </h2>
                <p className="text-white/80">
                  {isClockIn ? 'Job: Kitchen Repair at 123 Main St' : 'Start tracking time for a job'}
                </p>
              </div>
            </div>
            <Button 
              size="lg"
              className={isClockIn 
                ? 'bg-red-600 hover:bg-red-500' 
                : 'bg-white text-blue-600 hover:bg-white/90'
              }
            >
              {isClockIn ? (
                <>
                  <Square className="h-5 w-5 mr-2" />
                  Clock Out
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Clock In
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:border-violet-400/60 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <Clock className="h-10 w-10 mx-auto text-violet-600 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Hourly Rate</h3>
            <p className="text-sm text-slate-500">Track time and bill by the hour</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:border-violet-400/60 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <MapPin className="h-10 w-10 mx-auto text-violet-600 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Fixed Price</h3>
            <p className="text-sm text-slate-500">Bill a flat rate for the job</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-slate-900">Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">No time entries yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Clock in to start tracking time for your jobs
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{entry.job}</h3>
                      <p className="text-sm text-slate-500">{entry.date}</p>
                    </div>
                    <span className="text-blue-600 font-bold">{entry.hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GPS Notice */}
      <Card className="bg-slate-100 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-slate-500" />
            <p className="text-sm text-slate-600">
              <strong className="text-slate-700">GPS Tracking:</strong> When enabled, your location will be recorded while clocked in for verification purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
