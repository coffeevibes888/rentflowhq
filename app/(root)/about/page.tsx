// Cache this page for 1 hour - it's static content
export const revalidate = 3600;

const AboutPage = () => {
  const photos = [
    { id: 1, label: 'Founder', src: '/images/allenPic2.jpg' },
    { id: 2, label: 'Me', src: '/images/me.png' },
  ];

  return (
    <main className="w-full min-h-screen py-10">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <header className="space-y-2 mb-10 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-violet-300">About</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-[0_0_35px_rgba(139,92,246,0.4)]">
            Property Flow HQ
          </h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-200/90">
            Built by a property manager, for property managers. This is the story behind the platform.
          </p>
        </header>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)] items-start">
          <div className="space-y-6">
            <div className="rounded-3xl border border-violet-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950/70 p-6 md:p-8 shadow-[0_0_60px_rgba(124,58,237,0.35)]">
              <p className="text-xs font-semibold tracking-[0.2em] text-violet-200 uppercase mb-2">The Story</p>
              <p className="text-sm md:text-base text-gray-100 leading-relaxed">
                Before Property Flow HQ was software, it was real life.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                For years, I worked as a property manager doing things the old-school way — collecting rent in cash, tracking payments on green sheets, and spending long nights manually uploading reports into QuickBooks. No automation. No dashboards. Just paperwork, spreadsheets, and constant follow-ups.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                I knew the job inside and out because I lived it. The late rent reminders. The missing payments. The stress of keeping everything organized while trying to manage people, properties, and time — all at once.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                Eventually, I saw the problem clearly: property managers were being forced to work harder than necessary with outdated tools that weren&apos;t built for how we actually operate.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                So I did something about it.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                I became a web developer and started building the system I always wished I had.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                Property Flow HQ was created by a property manager, for property managers — designed to simplify rent collection, automate reminders, track payments cleanly, and eliminate the chaos of manual reporting. Every feature is rooted in real-world experience, not theory.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                This platform isn&apos;t bloated. It&apos;s practical, affordable, and built to help landlords and property managers save time, reduce stress, and stay organized — without needing a tech background.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                If you&apos;ve ever chased rent, sorted paperwork late at night, or wished there was an easier way — this was built for you.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                Welcome to Property Flow HQ. 🏠✨
              </p>
            </div>
          </div>

          <div className="relative h-[420px] md:h-[480px] lg:h-[520px]">
            <div className="absolute inset-0 bg-gradient-radial from-violet-500/35 via-transparent to-transparent blur-3xl opacity-80" />

            <div className="relative h-full flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-[4/5]">
                {/* Base card */}
                <div className="absolute inset-0 rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_0_45px_rgba(15,23,42,0.9)]" />

                {/* Floating photos */}
                <div className="group/pile absolute inset-0">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className={`absolute rounded-2xl border border-white/15 overflow-hidden bg-slate-900/80 shadow-[0_18px_45px_rgba(15,23,42,0.85)] transition-all duration-300 ease-out cursor-pointer
                        hover:z-30 hover:scale-105 hover:-translate-y-2
                        group-hover/pile:opacity-70 hover:!opacity-100
                      `}
                      style={{
                        top: `${10 + index * 6}%`,
                        left: `${index % 2 === 0 ? 4 + index * 10 : 22 + index * 8}%`,
                        width: index === 1 || index === 2 ? '56%' : '48%',
                        height: index === 1 ? '52%' : index === 2 ? '50%' : '44%',
                        transform: `rotate(${index % 2 === 0 ? -6 + index * 2 : 8 - index * 2}deg)`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.src}
                        alt={photo.label}
                        className="h-full w-full object-cover" 
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-4 text-[11px] text-gray-100 flex items-center justify-between">
                        <span className="uppercase tracking-[0.15em] text-gray-300">{photo.label}</span>
                        <span className="text-[10px] text-violet-300">Property Flow HQ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;
