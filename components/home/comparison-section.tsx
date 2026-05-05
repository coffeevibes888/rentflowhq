import Link from 'next/link';
import { Check, X, ArrowRight, Trophy } from 'lucide-react';

type CellVal = 'yes' | 'no' | 'extra' | string;

interface CompRow {
  feature: string;
  vals: [CellVal, CellVal, CellVal, CellVal];
}

// ── PM comparison ─────────────────────────────────────────────────
const pmRows: CompRow[] = [
  { feature: 'Monthly price',          vals: ['$19.99',  '$55+',    '$280+',   'Free']    },
  { feature: 'Rent collection fee',    vals: ['$0',      '0.5%+',   '0.5%+',   '3.49%+']  },
  { feature: 'E-Signatures',           vals: ['yes',     'extra',   'extra',   'no']       },
  { feature: 'Contractor Marketplace', vals: ['yes',     'no',      'no',      'no']       },
  { feature: 'White-label portal',     vals: ['yes',     'no',      'no',      'no']       },
  { feature: 'ID & Paystub Scanner',   vals: ['yes',     'extra',   'extra',   'no']       },
  { feature: 'Maintenance tracking',   vals: ['yes',     'yes',     'yes',     'Basic']    },
  { feature: 'Unlimited leases',       vals: ['yes',     'extra',   'extra',   'no']       },
  { feature: 'Auto late fees',         vals: ['yes',     'extra',   'yes',     'no']       },
];

const pmCols = ['PropertyFlow HQ', 'Buildium', 'AppFolio', 'TurboTenant'];

// ── Contractor comparison ─────────────────────────────────────────
const contractorRows: CompRow[] = [
  { feature: 'Monthly price',           vals: ['$19.99',  '$300+',   'Per lead',  '$49+']   },
  { feature: 'Cost per job/lead',        vals: ['$0',      '$15-80+', '$15-50+',   '$0']     },
  { feature: 'Jobs & work orders',       vals: ['yes',     'no',      'no',        'yes']    },
  { feature: 'Invoicing & estimates',    vals: ['yes',     'no',      'no',        'yes']    },
  { feature: 'Team scheduling',          vals: ['yes',     'no',      'no',        'Pro+']   },
  { feature: 'GPS time tracking',        vals: ['yes',     'no',      'no',        'extra']  },
  { feature: 'Branded profile page',     vals: ['yes',     'no',      'no',        'no']     },
  { feature: 'Property Manager access',  vals: ['yes',     'no',      'no',        'no']     },
  { feature: 'Inventory tracking',       vals: ['yes',     'no',      'no',        'Pro+']   },
];

const contractorCols = ['PropertyFlow HQ', 'Angi Leads', 'Thumbtack', 'Jobber'];

function Cell({ val, isUs, accentColor }: { val: CellVal; isUs: boolean; accentColor: string }) {
  if (val === 'yes') {
    return (
      <span className='flex justify-center'>
        <Check className={`h-4 w-4 ${isUs ? accentColor : 'text-emerald-500'}`} />
      </span>
    );
  }
  if (val === 'no') {
    return (
      <span className='flex justify-center'>
        <X className='h-4 w-4 text-red-400/50' />
      </span>
    );
  }
  if (val === 'extra') {
    return <span className='block text-center text-xs font-bold text-amber-400'>Extra $</span>;
  }
  return (
    <span className={`block text-center text-sm sm:text-base font-bold ${isUs ? accentColor : 'text-slate-400'}`}>
      {val}
    </span>
  );
}

export default function ComparisonSection({ variant = 'pm' }: { variant?: 'pm' | 'contractor' }) {
  const isPM = variant === 'pm';
  const rows = isPM ? pmRows : contractorRows;
  const cols  = isPM ? pmCols : contractorCols;

  const gradientCls = isPM ? 'from-cyan-500 to-blue-600'   : 'from-rose-500 to-orange-500';
  const accentText  = isPM ? 'text-cyan-600'                : 'text-rose-600';
  const accentCell  = isPM ? 'text-cyan-600'                : 'text-rose-600';
  const badgeCls    = isPM
    ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
    : 'bg-rose-50 border-rose-200 text-rose-700';
  const signUpHref  = isPM ? '/sign-up' : '/sign-up?role=contractor';

  return (
    <section className='w-full py-12 md:py-20 px-3 md:px-4 bg-slate-50'>
      <div className='max-w-6xl mx-auto space-y-8'>

        {/* Header */}
        <div className='text-center space-y-3'>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold border ${badgeCls}`}>
            <Trophy className='h-4 w-4' />
            {isPM ? 'The Honest Comparison' : 'Stop Paying Per Lead'}
          </div>
          <h2 className='text-3xl sm:text-4xl md:text-5xl font-black text-slate-900'>
            {isPM
              ? "We're Half the Price."
              : 'More Features.'}{' '}
            <span className={`bg-gradient-to-r ${isPM ? 'from-cyan-500 to-blue-600' : 'from-rose-500 to-orange-500'} bg-clip-text text-transparent`}>
              {isPM ? 'Twice the Features.' : 'One Flat Price.'}
            </span>
          </h2>
          <p className='text-base md:text-lg text-slate-500 max-w-2xl mx-auto'>
            {isPM
              ? "Compare us to the industry leaders. You'll see why property managers are switching."
              : "Angi and Thumbtack charge you hundreds just to compete for a single job. We don't."}
          </p>
        </div>

        {/* Table */}
        <div className='relative overflow-x-auto rounded-2xl border border-blue-200 shadow-lg bg-blue-50'>
          <table className='w-full border-collapse bg-transparent text-left'>
            <thead>
              <tr>
                <th className='px-4 py-5 text-sm font-bold uppercase tracking-wider text-slate-500 w-[35%] border-b border-blue-200 bg-blue-100'>
                  Feature
                </th>
                {cols.map((col, i) => (
                  <th
                    key={col}
                    className={`px-3 py-4 text-center border-b border-blue-200 ${i === 0 ? 'bg-cyan-100' : 'bg-blue-100'}`}
                  >
                    {i === 0 ? (
                      <div className='flex flex-col items-center gap-1'>
                        <span className={`text-sm font-black uppercase tracking-wide ${accentText}`}>{col}</span>
                        <span className='inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-500/30'>
                          ✓ Best Value
                        </span>
                      </div>
                    ) : (
                      <span className='text-sm font-semibold text-slate-400'>{col}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-blue-100 transition-colors hover:bg-cyan-50/60 ${i % 2 === 0 ? 'bg-blue-50/40' : 'bg-blue-100/40'}`}
                >
                  <td className='px-4 py-4 text-sm sm:text-base font-semibold text-slate-700'>
                    {row.feature}
                  </td>
                  {row.vals.map((val, vi) => (
                    <td key={vi} className={`px-3 py-4 ${vi === 0 ? 'bg-cyan-100/80' : ''}`}>
                      <Cell val={val} isUs={vi === 0} accentColor={accentCell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom CTA */}
        <div className='text-center pt-2'>
          <Link
            href={signUpHref}
            className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${gradientCls} text-white px-8 py-3.5 text-sm font-bold shadow-xl hover:scale-105 transition-transform duration-200`}
          >
            Start Your Free 14-Day Trial
            <ArrowRight className='h-4 w-4' />
          </Link>
          <p className='mt-2 text-xs text-slate-500'>14-day free trial. Cancel anytime.</p>
        </div>
      </div>
    </section>
  );
}
