import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AnimatedCounter from '../components/AnimatedCounter';
import { SECTION_WRAP } from '../lib/cta';

gsap.registerPlugin(ScrollTrigger);

type Metric = {
  id: string;
  label: string;
  detail: string;
  renderValue: (className: string) => ReactNode;
};

const metrics: Metric[] = [
  {
    id: 'booking',
    label: 'Higher Booking Rate',
    detail: 'Lift in inquiry → appointment conversion after system install',
    renderValue: (className) => (
      <span className={className}>
        <AnimatedCounter target={32} prefix="+" suffix="%" duration={1.6} />
      </span>
    ),
  },
  {
    id: 'response',
    label: 'Response Time',
    detail: 'Median first reply — inquiry to contact',
    renderValue: (className) => (
      <span className={className}>
        <span className="text-[0.55em] font-medium align-super mr-0.5 text-primary/80">&lt;</span>
        <AnimatedCounter target={5} suffix=" min" duration={1.4} />
      </span>
    ),
  },
  {
    id: 'revenue',
    label: 'Recovered Revenue',
    detail: 'Monthly pipeline previously lost after first contact',
    renderValue: (className) => (
      <span className={className}>
        <AnimatedCounter target={47} prefix="$" suffix="K+" duration={1.8} />
      </span>
    ),
  },
  {
    id: 'reviews',
    label: 'Google Review Velocity',
    detail: 'Increase in new five-star reviews per month',
    renderValue: (className) => (
      <span className={className}>
        <AnimatedCounter target={2.4} prefix="×" decimals={1} duration={1.5} />
      </span>
    ),
  },
];

export default function SocialProof() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headerRef.current || !gridRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current!.children,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );

      const cells = gridRef.current!.querySelectorAll('[data-kpi]');
      gsap.fromTo(
        cells,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 82%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="proof"
      ref={sectionRef}
      className="relative border-t border-[#1C1C1C] bg-[#0A0A0A]"
      aria-labelledby="proof-headline"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201, 169, 98, 0.04) 0%, transparent 55%)',
        }}
      />

      <div className={`relative ${SECTION_WRAP} py-24 md:py-32 lg:py-36`}>
        <div ref={headerRef} className="mx-auto max-w-[720px] text-center">
          <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-primary sm:text-xs">
            Measured Results
          </p>
          <h2
            id="proof-headline"
            className="text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-[#F5F0E8]"
          >
            Proof over promises.
          </h2>
          <p className="mx-auto mt-6 max-w-[32rem] text-base leading-relaxed text-[#A8A29E] sm:text-lg sm:leading-[1.65]">
            We measure business outcomes, not marketing activities.
          </p>
        </div>

        {/* Executive KPI board — hairline grid, not SaaS cards */}
        <div
          ref={gridRef}
          className="mx-auto mt-16 max-w-[1100px] md:mt-20 lg:mt-24"
        >
          <div className="grid grid-cols-1 border-t border-[#1F1F1F] sm:grid-cols-2 lg:grid-cols-4 lg:border-l lg:border-[#1F1F1F]">
            {metrics.map((metric) => (
              <article
                key={metric.id}
                data-kpi
                className="group relative flex flex-col border-b border-[#1F1F1F] px-6 py-10 sm:px-8 sm:py-12 lg:border-r lg:px-9 lg:py-14"
              >
                {/* Soft gold wash on hover — subtle, not glow-heavy */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(201, 169, 98, 0.04) 0%, transparent 55%)',
                  }}
                  aria-hidden
                />

                <p className="relative text-[11px] font-medium uppercase tracking-[0.16em] text-[#6B6560]">
                  {metric.label}
                </p>

                <div className="relative mt-6 md:mt-8">
                  {metric.renderValue(
                    'block font-display text-[clamp(2.75rem,5vw,3.75rem)] font-semibold italic leading-none tracking-[-0.03em] text-[#F5F0E8]'
                  )}
                </div>

                <p className="relative mt-5 max-w-[16rem] text-sm leading-relaxed text-[#6B6560] md:mt-6">
                  {metric.detail}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-10 text-center text-xs leading-relaxed text-[#4A4540] md:mt-12">
            Composite client ranges. Individual results vary by market and execution.
          </p>
        </div>
      </div>
    </section>
  );
}
