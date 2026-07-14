import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';
import { PRIMARY_CTA, CTA_BUTTON_CLASS, SECTION_WRAP } from '../lib/cta';

interface CTAProps {
  onBookCall: () => void;
}

export default function CTA({ onBookCall }: CTAProps) {
  return (
    <section id="contact" className="bg-[#0C0C0C] border-t border-[#1C1C1C]">
      <div className={`${SECTION_WRAP} py-20 md:py-28`}>
        <ScrollReveal className="max-w-[720px] mx-auto text-center">
          <SectionLabel text="BOOK YOUR REVENUE DIAGNOSTIC" />
          <h2 className="text-[clamp(1.85rem,3.8vw,3rem)] font-semibold text-[#F5F0E8] leading-[1.15] tracking-[-0.015em]">
            The phone can ring all day.
            <br />
            The calendar still has gaps.
          </h2>
          <p className="mt-6 text-lg text-[#A8A29E] leading-relaxed max-w-[560px] mx-auto">
            That is the leak. Book a 20-minute Revenue Diagnostic. Leave knowing where booked revenue is escaping — and what to fix first.
          </p>
          <button
            type="button"
            onClick={onBookCall}
            className={`${CTA_BUTTON_CLASS} mt-10 w-full sm:w-auto`}
          >
            {PRIMARY_CTA}
          </button>
          <p className="mt-5 text-sm text-[#6B6560]">
            Takes two minutes to schedule. Twenty minutes to see the gap.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
