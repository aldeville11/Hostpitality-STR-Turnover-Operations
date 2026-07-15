import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CTA_BUTTON_CLASS, CTA_BUTTON_SECONDARY, SECTION_WRAP } from '../lib/cta';

interface HeroProps {
  onBookCall: () => void;
}

const TRUST = ['Faster response', 'Higher booking rates', 'Recovered revenue'] as const;

export default function Hero({ onBookCall }: HeroProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const elements = contentRef.current.children;
    gsap.set(elements, { opacity: 0, y: 24 });
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    Array.from(elements).forEach((el, i) => {
      tl.to(el, { opacity: 1, y: 0, duration: 0.6 }, i === 0 ? 0.15 : '-=0.32');
    });
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#0A0A0A]"
      aria-labelledby="hero-headline"
    >
      {/* Atmospheric plane — full-bleed, restrained */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(201, 169, 98, 0.09) 0%, transparent 58%), linear-gradient(180deg, #0A0A0A 0%, #0A0A0A 70%, #0C0C0C 100%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]" aria-hidden>
        <img
          src="/hero-bg.jpg"
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/40 via-[#0A0A0A]/75 to-[#0A0A0A]" />
      </div>

      <div
        ref={contentRef}
        className={`relative z-10 w-full ${SECTION_WRAP} pt-28 pb-20 md:pt-36 md:pb-28`}
      >
        <div className="mx-auto max-w-[760px] text-center sm:mx-0 sm:text-left">
          {/* Brand + category */}
          <div className="mb-8 md:mb-10">
            <p className="font-display text-[1.375rem] font-bold italic tracking-[-0.02em] text-[#F5F0E8] md:text-[1.5rem]">
              Vinton Adler &amp; Co.
            </p>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-primary sm:text-xs">
              Customer Acquisition Systems
            </p>
          </div>

          {/* Headline */}
          <h1
            id="hero-headline"
            className="text-balance text-[clamp(2rem,5.5vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F5F0E8]"
          >
            More booked appointments from the demand you already have.
          </h1>

          {/* Subheadline */}
          <div className="mx-auto mt-7 max-w-[34rem] space-y-4 text-base leading-relaxed text-[#A8A29E] sm:mx-0 sm:text-lg sm:leading-[1.65]">
            <p>
              Most service businesses don&apos;t have a lead problem.
              <br className="hidden sm:block" />
              {' '}They have a conversion problem.
            </p>
            <p>
              We redesign the systems behind customer acquisition so more inquiries become booked appointments.
            </p>
          </div>

          {/* Trust row */}
          <ul className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-3">
            {TRUST.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2.5 text-sm font-medium text-[#C8C2BA]"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>

          {/* CTAs — one primary on mobile */}
          <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={onBookCall}
              className={`${CTA_BUTTON_CLASS} w-full px-7 sm:w-auto`}
            >
              Book My Customer Acquisition Diagnostic
            </button>
            <a
              href="#problem"
              className={`${CTA_BUTTON_SECONDARY} w-full sm:w-auto`}
            >
              See Where Bookings Are Lost
            </a>
          </div>

          <p className="mt-6 text-sm text-[#6B6560]">
            20 minutes. Built for owner-operated service businesses.
          </p>
        </div>
      </div>
    </section>
  );
}
