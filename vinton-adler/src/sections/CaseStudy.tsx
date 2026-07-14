import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';
import { PRIMARY_CTA, CTA_BUTTON_CLASS, SECTION_WRAP } from '../lib/cta';

interface CaseStudyProps {
  onBookCall: () => void;
}

const beforeAfter = [
  { label: 'Avg. first response', before: '4–6 hours', after: 'Under 5 minutes' },
  { label: 'Inquiry → booking rate', before: 'Baseline', after: '+27% in 45 days' },
  { label: 'Missed-call recovery', before: 'Near zero', after: 'Same-day callbacks booked' },
  { label: 'Review velocity', before: 'Inconsistent', after: 'Steady weekly five-stars' },
];

export default function CaseStudy({ onBookCall }: CaseStudyProps) {
  return (
    <section id="results" className="bg-background border-t border-[#1C1C1C]">
      <div className={`${SECTION_WRAP} py-20 md:py-28`}>
        <ScrollReveal className="max-w-[680px] mb-12">
          <SectionLabel text="CASE STUDY / RESULTS" />
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold text-[#F5F0E8] leading-[1.15] tracking-[-0.015em]">
            Midwest HVAC · Owner-operated
          </h2>
          <p className="mt-4 text-[#A8A29E] leading-relaxed">
            Strong inbound demand. Thin booking rate. Lead spend rising while the schedule had gaps. We did not buy more ads. We fixed conversion.
          </p>
        </ScrollReveal>

        <ScrollReveal className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-10" stagger={0.06}>
          {beforeAfter.map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-[#262626] bg-card p-6"
            >
              <p className="text-sm text-[#6B6560] mb-4">{row.label}</p>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#6B6560] mb-1">Before</p>
                  <p className="text-[#A8A29E]">{row.before}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-primary mb-1">After</p>
                  <p className="text-[#F5F0E8] font-semibold">{row.after}</p>
                </div>
              </div>
            </div>
          ))}
        </ScrollReveal>

        <ScrollReveal>
          <blockquote className="border-l-2 border-primary pl-6 max-w-[680px]">
            <p className="text-lg md:text-xl text-[#F5F0E8] leading-relaxed">
              “We stopped chasing more leads and started closing the ones we already had. The system paid for itself in the first month.”
            </p>
            <footer className="mt-4 text-sm text-[#6B6560]">
              Michael R. · HVAC · Midwest
            </footer>
          </blockquote>
          <p className="mt-4 text-xs text-[#6B6560] max-w-[560px]">
            Results vary by vertical, market, and execution. The Diagnostic shows what is realistic for your numbers before you commit.
          </p>
          <button type="button" onClick={onBookCall} className={`${CTA_BUTTON_CLASS} mt-8 w-full sm:w-auto`}>
            {PRIMARY_CTA}
          </button>
        </ScrollReveal>
      </div>
    </section>
  );
}
