import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PRIMARY_CTA, CTA_BUTTON_CLASS, CTA_BUTTON_SECONDARY, SECTION_WRAP } from '../lib/cta';

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  onBookCall: () => void;
}

export default function Hero({ onBookCall }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const elements = contentRef.current.children;
    gsap.set(elements, { opacity: 0, y: 28 });
    const tl = gsap.timeline();
    Array.from(elements).forEach((el, i) => {
      tl.to(el, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, i === 0 ? 0 : '-=0.28');
    });
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-center overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(201, 169, 98, 0.07) 0%, transparent 55%), #0A0A0A',
      }}
    >
      <div className="absolute inset-0 opacity-25 pointer-events-none" aria-hidden>
        <img src="/hero-bg.jpg" alt="" className="w-full h-full object-cover" />
      </div>

      <div
        ref={contentRef}
        className={`relative z-10 ${SECTION_WRAP} w-full pt-28 pb-16 md:pt-32 md:pb-24`}
      >
        <div className="max-w-[780px]">
          <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.14em] text-primary mb-5">
            Customer Acquisition &amp; Revenue Operations
          </p>

          <h1 className="font-display text-[clamp(2.25rem,5.5vw,4.25rem)] italic font-bold text-[#F5F0E8] leading-[1.08] tracking-[-0.02em]">
            Vinton Adler
          </h1>

          <p className="mt-4 text-[clamp(1.35rem,3.2vw,2.15rem)] font-semibold text-[#F5F0E8] leading-[1.2] tracking-[-0.015em]">
            More booked appointments from the demand you already have.
          </p>

          <p className="mt-6 text-base sm:text-lg text-[#A8A29E] max-w-[560px] leading-relaxed">
            Most service businesses do not have a lead problem. They have a conversion problem.
            We redesign the systems behind customer acquisition so more inquiries become paid jobs.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#A8A29E]">
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              Higher booking rates
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              Faster response
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              Recovered revenue
            </span>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <button type="button" onClick={onBookCall} className={CTA_BUTTON_CLASS}>
              {PRIMARY_CTA}
            </button>
            <a href="#problem" className={CTA_BUTTON_SECONDARY}>
              See Where Revenue Leaks
            </a>
          </div>

          <p className="mt-5 text-sm text-[#6B6560]">
            20-minute Revenue Diagnostic · Built for owner-operated service businesses
          </p>
        </div>
      </div>
    </section>
  );
}
