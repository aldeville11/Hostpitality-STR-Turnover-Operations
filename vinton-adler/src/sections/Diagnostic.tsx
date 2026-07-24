import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';
import { PRIMARY_CTA, CTA_BUTTON_CLASS, SECTION_WRAP } from '../lib/cta';

interface DiagnosticProps {
  onBookCall: () => void;
}

const delivers = [
  'Where booked appointments are dropping off today',
  'How much demand is leaking after the inquiry arrives',
  'The single highest-ROI fix to make first',
  'A clear 30–60 day path to more bookings',
];

export default function Diagnostic({ onBookCall }: DiagnosticProps) {
  return (
    <section id="diagnostic" className="bg-background border-t border-[#1C1C1C]">
      <div className={`${SECTION_WRAP} py-20 md:py-28`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <ScrollReveal>
            <SectionLabel text="REVENUE LEAK DIAGNOSTIC" />
            <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold text-[#F5F0E8] leading-[1.15] tracking-[-0.015em]">
              Twenty minutes.
              <br />
              Exact clarity on what to fix.
            </h2>
            <p className="mt-5 text-[#A8A29E] leading-relaxed max-w-[480px]">
              The Revenue Diagnostic maps your intake, response, and follow-up. You leave knowing where revenue is leaking — and what it is costing you.
            </p>
            <p className="mt-4 text-sm text-[#6B6560]">
              Complimentary for qualified owner-operated service businesses.
            </p>
            <button type="button" onClick={onBookCall} className={`${CTA_BUTTON_CLASS} mt-8 w-full sm:w-auto`}>
              {PRIMARY_CTA}
            </button>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="rounded-xl border border-[#262626] bg-card p-7 md:p-9">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary mb-6">
                You walk away with
              </p>
              <ul className="space-y-5">
                {delivers.map((item) => (
                  <li key={item} className="flex gap-4 items-start">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-[#F5F0E8] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
