import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';
import { SECTION_WRAP } from '../lib/cta';

const metrics = [
  { value: '18–42%', label: 'More booked appointments', note: 'After fixing response & follow-up' },
  { value: '<5 min', label: 'Target response time', note: 'From inquiry to first reply' },
  { value: '10–30%', label: 'Inbound revenue at risk', note: 'Lost before booking on average' },
  { value: '2–3', label: 'Clients per market', note: 'Focused capacity, not volume' },
];

const verticals = [
  'HVAC',
  'Roofing',
  'Electrical',
  'Plumbing',
  'Restoration',
  'Med Spas',
  'Dental',
  'Legal',
  'Home Services',
];

export default function SocialProof() {
  return (
    <section id="proof" className="bg-background border-t border-[#1C1C1C]">
      <div className={`${SECTION_WRAP} py-16 md:py-20`}>
        <ScrollReveal>
          <SectionLabel text="TRUSTED BY OWNERS WHO MEASURE BOOKINGS" />
          <h2 className="text-[clamp(1.65rem,3vw,2.25rem)] font-semibold text-[#F5F0E8] leading-tight max-w-[640px]">
            Proof over promises.
          </h2>
          <p className="mt-3 text-[#A8A29E] max-w-[520px] leading-relaxed">
            We report outcomes that hit the P&amp;L — appointments booked, response speed, and revenue recovered from demand you already paid to generate.
          </p>
        </ScrollReveal>

        <ScrollReveal className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5" stagger={0.08}>
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-[#262626] bg-card px-6 py-7"
            >
              <p className="text-3xl md:text-4xl font-semibold text-primary tracking-tight">{m.value}</p>
              <p className="mt-2 text-[#F5F0E8] font-medium">{m.label}</p>
              <p className="mt-1 text-sm text-[#6B6560]">{m.note}</p>
            </div>
          ))}
        </ScrollReveal>

        <ScrollReveal className="mt-12">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#6B6560] mb-4">
            Verticals we serve
          </p>
          <div className="flex flex-wrap gap-2.5">
            {verticals.map((v) => (
              <span
                key={v}
                className="text-sm text-[#A8A29E] border border-[#262626] rounded-md px-3.5 py-2"
              >
                {v}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
