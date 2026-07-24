import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SECTION_WRAP } from '../lib/cta';

gsap.registerPlugin(ScrollTrigger);

const findings = [
  {
    id: 'L-01',
    title: 'Slow Response',
    impact: 'Buyer books competitor first.',
    bookingEffect: 'First-contact advantage transfers to whoever replies faster.',
    estimate: '10–18%',
    estimateLabel: 'booking loss',
  },
  {
    id: 'L-02',
    title: 'Missed After-Hours Calls',
    impact: 'Urgent jobs never hit the calendar.',
    bookingEffect: 'Peak-intent inquiries expire overnight with no capture path.',
    estimate: '8–15%',
    estimateLabel: 'booking loss',
  },
  {
    id: 'L-03',
    title: 'Weak Follow-Up',
    impact: 'Warm leads go cold after one attempt.',
    bookingEffect: 'Multi-touch closes never start — one miss ends the pipeline.',
    estimate: '12–20%',
    estimateLabel: 'booking loss',
  },
  {
    id: 'L-04',
    title: 'Unclear Next Step',
    impact: 'Prospects leave without booking.',
    bookingEffect: 'Interest stalls at “we’ll call you back” instead of a confirmed slot.',
    estimate: '7–14%',
    estimateLabel: 'booking loss',
  },
  {
    id: 'L-05',
    title: 'No Source Visibility',
    impact: 'You fund channels that do not convert.',
    bookingEffect: 'Spend scales inquiries — not appointments — and masks true CAC.',
    estimate: '15–25%',
    estimateLabel: 'wasted acquisition',
  },
  {
    id: 'L-06',
    title: 'Staff Overload',
    impact: 'Busy days become peak leakage.',
    bookingEffect: 'Highest inquiry volume coincides with lowest booking capacity.',
    estimate: '9–16%',
    estimateLabel: 'booking loss',
  },
] as const;

export default function WhyLoseCustomers() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }

      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll('[data-finding]');
        gsap.fromTo(
          cards,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.07,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 78%',
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
      id="why-lose"
      ref={sectionRef}
      className="relative border-t border-[#1C1C1C] bg-[#0A0A0A]"
      aria-labelledby="leaks-headline"
    >
      <div className={`relative ${SECTION_WRAP} py-24 md:py-32 lg:py-36`}>
        <div ref={headerRef} className="mx-auto max-w-[680px] text-center md:mx-0 md:text-left">
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary sm:text-xs">
            Diagnostic Findings
          </p>
          <h2
            id="leaks-headline"
            className="text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#F5F0E8]"
          >
            Six leaks that cut booking rate.
          </h2>
          <p className="mt-5 max-w-[34rem] text-base leading-relaxed text-[#A8A29E] md:mx-0 md:text-[17px]">
            Recurring findings across owner-operated service businesses — measured by impact on appointments, not activity.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-14 grid grid-cols-1 gap-3 sm:mt-16 sm:grid-cols-2 sm:gap-4 lg:mt-20 lg:grid-cols-3 lg:gap-5"
        >
          {findings.map((finding) => (
            <article
              key={finding.id}
              data-finding
              className="flex flex-col border border-[#222] bg-[#0E0E0E] px-6 py-7 sm:px-7 sm:py-8"
            >
              {/* Finding meta — audit header */}
              <div className="flex items-center justify-between gap-3 border-b border-[#1C1C1C] pb-4">
                <span className="font-mono text-[11px] tracking-[0.12em] text-primary">
                  {finding.id}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#4A4540]">
                  Finding
                </span>
              </div>

              {/* Leak title */}
              <h3 className="mt-5 text-[1.2rem] font-semibold leading-snug tracking-[-0.015em] text-[#F5F0E8] sm:text-[1.3rem]">
                {finding.title}
              </h3>

              {/* Business impact */}
              <p className="mt-3 text-[15px] leading-relaxed text-[#A8A29E]">
                {finding.impact}
              </p>

              {/* How it affects booking rate */}
              <div className="mt-6 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#4A4540]">
                  Booking effect
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#7A736C]">
                  {finding.bookingEffect}
                </p>
              </div>

              {/* Estimated cost — dominant KPI footer */}
              <div className="mt-7 border-t border-[#1C1C1C] pt-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#4A4540]">
                  Estimated impact
                </p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-[1.85rem] font-semibold italic leading-none tracking-[-0.02em] text-[#F5F0E8] tabular-nums">
                    {finding.estimate}
                  </span>
                  <span className="text-sm text-primary">{finding.estimateLabel}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
