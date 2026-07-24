import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SECTION_WRAP } from '../lib/cta';

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  { count: 100, label: 'Inquiries', lost: 0 },
  { count: 82, label: 'Contacted', lost: 18 },
  { count: 61, label: 'Conversations', lost: 21 },
  { count: 39, label: 'Appointments', lost: 22 },
  { count: 22, label: 'Customers', lost: 17 },
] as const;

const TOTAL_LOST = 78;

export default function RevenueLeakProblem() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !pipelineRef.current) return;

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }

      const rows = pipelineRef.current!.querySelectorAll('[data-stage]');
      const drops = pipelineRef.current!.querySelectorAll('[data-drop]');
      const bars = pipelineRef.current!.querySelectorAll('[data-bar]');

      gsap.set(rows, { opacity: 0, y: 28 });
      gsap.set(drops, { opacity: 0, scale: 0.85 });
      gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pipelineRef.current,
          start: 'top 72%',
          once: true,
        },
        defaults: { ease: 'power3.out' },
      });

      rows.forEach((row, i) => {
        const at = i === 0 ? 0 : '-=0.05';
        tl.to(row, { opacity: 1, y: 0, duration: 0.55 }, at);
        tl.to(bars[i], { scaleX: 1, duration: 0.7, ease: 'power2.out' }, '-=0.35');
        if (drops[i]) {
          tl.to(drops[i], { opacity: 1, scale: 1, duration: 0.4 }, '-=0.35');
        }
      });

      if (closeRef.current) {
        gsap.fromTo(
          closeRef.current.children,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.14,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: closeRef.current,
              start: 'top 88%',
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="problem"
      ref={sectionRef}
      className="relative border-t border-[#1C1C1C] bg-[#0C0C0C]"
      aria-labelledby="problem-headline"
    >
      <div className={`relative ${SECTION_WRAP} py-24 md:py-32 lg:py-36`}>
        <div ref={headerRef} className="mx-auto max-w-[640px] text-center">
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary sm:text-xs">
            The Problem
          </p>
          <h2
            id="problem-headline"
            className="text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#F5F0E8]"
          >
            Where booked revenue disappears.
          </h2>
        </div>

        {/* Conversion pipeline */}
        <div
          ref={pipelineRef}
          className="mx-auto mt-16 max-w-[560px] md:mt-20"
          role="img"
          aria-label="Conversion pipeline: 100 inquiries become 22 customers. 78 are lost along the way."
        >
          {STAGES.map((stage, i) => {
            const widthPct = stage.count;
            const isLast = i === STAGES.length - 1;
            // Fade intensity increases as volume drops
            const valueOpacity = 0.45 + (stage.count / 100) * 0.55;

            return (
              <div key={stage.label}>
                <div
                  data-stage
                  className="grid grid-cols-[4.75rem_1fr] items-center gap-5 sm:grid-cols-[5.75rem_1fr] sm:gap-8"
                >
                  <p
                    className="text-right font-display text-[clamp(1.85rem,4vw,2.65rem)] font-semibold italic leading-none tracking-[-0.03em] text-[#F5F0E8] tabular-nums"
                    style={{ opacity: valueOpacity }}
                  >
                    {stage.count}
                  </p>

                  <div className="min-w-0">
                    <div className="mb-2.5 flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium tracking-wide text-[#C8C2BA] sm:text-[15px]">
                        {stage.label}
                      </span>
                      <span className="text-xs tabular-nums text-[#4A4540]">
                        {stage.count}%
                      </span>
                    </div>
                    <div className="h-[3px] overflow-hidden rounded-full bg-[#1A1A1A]">
                      <div
                        data-bar
                        className="h-full rounded-full"
                        style={{
                          width: `${widthPct}%`,
                          background: isLast
                            ? 'linear-gradient(90deg, hsl(42 45% 57%) 0%, hsl(42 35% 40%) 100%)'
                            : `linear-gradient(90deg, hsl(42 45% ${57 - i * 4}%) 0%, hsl(42 30% ${45 - i * 3}%) 100%)`,
                          opacity: 0.55 + (stage.count / 100) * 0.45,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {!isLast ? (
                  <div
                    data-drop
                    className="grid grid-cols-[4.75rem_1fr] gap-5 py-3.5 sm:grid-cols-[5.75rem_1fr] sm:gap-8 sm:py-4"
                  >
                    <div className="flex flex-col items-end pr-1.5">
                      <span className="block h-4 w-px bg-[#2A2A2A] sm:h-5" />
                      <span className="text-[11px] leading-none text-[#4A4540]">↓</span>
                      <span className="block h-4 w-px bg-[#2A2A2A] sm:h-5" />
                    </div>
                    <div className="flex items-center">
                      <p className="text-xs tracking-[0.04em] text-[#5C564F]">
                        <span className="font-medium tabular-nums text-[#8A8075]">
                          −{STAGES[i + 1].lost}
                        </span>
                        <span className="ml-2 text-[#4A4540]">lost</span>
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Closing — punchline only */}
        <div ref={closeRef} className="mx-auto mt-16 max-w-[480px] text-center md:mt-20">
          <p className="text-[clamp(1.35rem,3vw,1.75rem)] font-semibold leading-snug tracking-[-0.015em] text-[#F5F0E8]">
            Where did the rest go?
          </p>
          <p className="mt-4 text-base text-[#A8A29E] sm:text-lg">
            <span className="font-medium text-primary tabular-nums">{TOTAL_LOST}</span>
            {' '}never became customers.
          </p>
          <p className="mt-6 text-sm font-medium tracking-wide text-[#6B6560] sm:text-[15px]">
            That missing revenue is what we find.
          </p>
        </div>
      </div>
    </section>
  );
}
