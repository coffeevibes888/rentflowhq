// Shared contractor job lifecycle section — used on both the homepage (/?for=contractor)
// and the dedicated /contractor landing page.

export function ContractorLifecycleSection() {
  return (
    <section className='w-full py-10 md:py-20 px-4'>
      <div className='max-w-6xl mx-auto space-y-8'>
        {/* Headline */}
        <div className='text-center space-y-3 max-w-3xl mx-auto'>
          <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent'>
            Complete Job Lifecycle
          </h2>
          <p className='text-sm sm:text-base md:text-lg text-black/70 leading-relaxed'>
            From the first lead to the final payment — every step of your job is tracked, automated, and connected.
            No more juggling spreadsheets, texts, and paper invoices. One flow handles quoting, contracts, scheduling, invoicing, and getting paid.
          </p>
          <div className='flex flex-wrap items-center justify-center gap-3 pt-2'>
            {[
              'Auto Invoicing',
              'E-Signature Contracts',
              'Built-in Scheduling',
              'Get Paid Faster',
            ].map((label) => (
              <span
                key={label}
                className='inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200'
              >
                <svg className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                </svg>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className='grid gap-4 md:gap-6 md:grid-cols-2'>
          <div className='md:col-span-2 group relative rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.01] bg-gradient-to-br from-orange-950 via-orange-900 to-orange-950 border border-orange-700/40 shadow-2xl'>
            <div className='absolute top-4 right-4 md:top-6 md:right-6'>
              <span className='inline-flex items-center gap-1 bg-orange-500/20 text-orange-200 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full border border-orange-500/40'>
                <span className='relative flex h-2 w-2'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2 w-2 bg-orange-500'></span>
                </span>
                AUTOMATED
              </span>
            </div>
            <div className='relative p-6 md:p-8 space-y-4 md:space-y-6'>
              <div className='space-y-2'>
                <h3 className='text-2xl md:text-3xl font-bold text-white'>From Lead to Payment</h3>
                <p className='text-orange-200/70 text-sm md:text-base'>Every job follows this flow — automatically</p>
              </div>

              {/* Mobile layout */}
              <div className='lg:hidden space-y-2'>
                {[
                  [
                    { label: 'Lead Comes In', sub: 'Marketplace or Direct', border: 'border-orange-400', color: 'text-orange-300' },
                    { label: 'Send Quote', sub: 'Built-in Quote Builder', border: 'border-amber-400', color: 'text-amber-300' },
                  ],
                  [
                    { label: 'Customer Accepts', sub: 'One Click Approval', border: 'border-amber-300', color: 'text-amber-200' },
                    { label: 'Contract Auto-Sent', sub: 'E-Signature Ready', border: 'border-orange-300', color: 'text-orange-200' },
                  ],
                  [
                    { label: 'Customer Signs', sub: 'Legally Binding', border: 'border-orange-300', color: 'text-orange-200' },
                    { label: 'Job Created', sub: 'Auto-Scheduled', border: 'border-amber-400', color: 'text-amber-300' },
                  ],
                  [
                    { label: 'Upload Photos', sub: 'Before / During / After', border: 'border-orange-400', color: 'text-orange-300' },
                    { label: 'Track Progress', sub: 'Real-Time Updates', border: 'border-amber-300', color: 'text-amber-200' },
                  ],
                  [
                    { label: 'Job Complete', sub: 'Customer Notified', border: 'border-orange-300', color: 'text-orange-200' },
                    { label: 'Invoice Sent', sub: 'Auto-Generated', border: 'border-amber-400', color: 'text-amber-300' },
                  ],
                  [
                    { label: 'Get Paid', sub: 'Direct to Bank', border: 'border-orange-500', color: 'text-orange-300' },
                    { label: 'Get Reviews', sub: 'Auto-Requested', border: 'border-amber-500', color: 'text-amber-300' },
                  ],
                ].map((row, i) => (
                  <div key={i} className='flex items-center gap-1 sm:gap-2'>
                    <div className={`flex-1 bg-orange-950/80 backdrop-blur-sm rounded-lg px-2 py-2 border-2 ${row[0].border} text-center shadow-sm`}>
                      <div className={`${row[0].color} text-[10px] sm:text-xs font-bold`}>{row[0].label}</div>
                      <div className='text-orange-100/60 text-[8px] sm:text-[10px] mt-0.5 font-semibold'>{row[0].sub}</div>
                    </div>
                    <svg className='h-4 w-4 text-orange-500 shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' />
                    </svg>
                    <div className={`flex-1 bg-orange-950/80 backdrop-blur-sm rounded-lg px-2 py-2 border-2 ${row[1].border} text-center shadow-sm`}>
                      <div className={`${row[1].color} text-[10px] sm:text-xs font-bold`}>{row[1].label}</div>
                      <div className='text-orange-100/60 text-[8px] sm:text-[10px] mt-0.5 font-semibold'>{row[1].sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop layout */}
              <div className='hidden lg:block space-y-4'>
                {/* Row 1 */}
                <div className='flex items-center justify-between gap-3'>
                  {[
                    { label: 'Lead Comes In', sub: 'Marketplace or Direct', border: 'border-orange-400', color: 'text-orange-300' },
                    { label: 'Send Quote', sub: 'Built-in Quote Builder', border: 'border-amber-400', color: 'text-amber-300' },
                    { label: 'Customer Accepts', sub: 'One Click Approval', border: 'border-amber-300', color: 'text-amber-200' },
                    { label: 'Contract Auto-Sent', sub: 'E-Signature Ready', border: 'border-orange-300', color: 'text-orange-200' },
                    { label: 'Customer Signs', sub: 'Legally Binding', border: 'border-orange-300', color: 'text-orange-200' },
                  ].map((node, i, arr) => (
                    <div key={node.label} className='flex items-center gap-3 flex-1'>
                      <div className={`bg-orange-950/80 backdrop-blur-sm rounded-lg px-4 py-3 border-2 ${node.border} text-center min-w-[100px] flex-1 shadow-sm`}>
                        <div className={`${node.color} text-xs font-bold`}>{node.label}</div>
                        <div className='text-orange-100/60 text-[10px] mt-0.5 font-semibold'>{node.sub}</div>
                      </div>
                      {i < arr.length - 1 && (
                        <svg className='h-3 w-5 text-orange-500 shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>

                {/* Connector down */}
                <div className='flex justify-end pr-[50px]'>
                  <div className='flex flex-col items-center'>
                    <div className='w-0.5 h-4 border-l-2 border-dashed border-orange-600'></div>
                    <svg className='h-3 w-5 text-orange-500 rotate-90' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' />
                    </svg>
                  </div>
                </div>

                {/* Row 2 — reversed */}
                <div className='flex items-center justify-between gap-3'>
                  {[
                    { label: 'Get Reviews', sub: 'Auto-Requested', border: 'border-amber-500', color: 'text-amber-300' },
                    { label: 'Get Paid', sub: 'Direct to Bank', border: 'border-orange-500', color: 'text-orange-300' },
                    { label: 'Invoice Sent', sub: 'Auto-Generated', border: 'border-amber-400', color: 'text-amber-300' },
                    { label: 'Job Complete', sub: 'Customer Notified', border: 'border-orange-300', color: 'text-orange-200' },
                    { label: 'Job Auto-Created', sub: 'Scheduled & Tracked', border: 'border-amber-300', color: 'text-amber-200' },
                  ].map((node, i, arr) => (
                    <div key={node.label} className='flex items-center gap-3 flex-1'>
                      {i > 0 && (
                        <svg className='h-4 w-4 text-orange-500 shrink-0 rotate-180' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' />
                        </svg>
                      )}
                      <div className={`bg-orange-950/80 backdrop-blur-sm rounded-lg px-4 py-3 border-2 ${node.border} text-center min-w-[100px] flex-1 shadow-sm`}>
                        <div className={`${node.color} text-xs font-bold`}>{node.label}</div>
                        <div className='text-orange-100/60 text-[10px] mt-0.5 font-semibold'>{node.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Connector down */}
                <div className='flex justify-start pl-[50px]'>
                  <div className='flex flex-col items-center'>
                    <div className='w-0.5 h-4 border-l-2 border-dashed border-orange-600'></div>
                    <svg className='h-4 w-4 text-orange-500 rotate-90' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' />
                    </svg>
                  </div>
                </div>

                {/* Row 3 — extras */}
                <div className='flex items-center gap-3'>
                  <div className='bg-orange-950/80 backdrop-blur-sm rounded-lg px-4 py-3 border-2 border-orange-400 text-center min-w-[100px] shadow-sm'>
                    <div className='text-orange-300 text-xs font-bold'>Upload Photos</div>
                    <div className='text-orange-100/60 text-[10px] mt-0.5 font-semibold'>Before / During / After</div>
                  </div>
                  <svg className='h-4 w-4 text-orange-500' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' />
                  </svg>
                  <div className='bg-orange-950/80 backdrop-blur-sm rounded-lg px-4 py-3 border-2 border-amber-400 text-center min-w-[100px] shadow-sm'>
                    <div className='text-amber-300 text-xs font-bold'>Change Orders</div>
                    <div className='text-orange-100/60 text-[10px] mt-0.5 font-semibold'>Scope & Price Updates</div>
                  </div>
                  <svg className='h-4 w-4 text-orange-500' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' />
                  </svg>
                  <div className='bg-orange-950/80 backdrop-blur-sm rounded-lg px-4 py-3 border-2 border-orange-300 text-center min-w-[100px] shadow-sm'>
                    <div className='text-orange-200 text-xs font-bold'>Warranty Tracking</div>
                    <div className='text-orange-100/60 text-[10px] mt-0.5 font-semibold'>Auto Reminders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
