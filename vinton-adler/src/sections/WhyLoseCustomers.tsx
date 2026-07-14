import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';
import { SECTION_WRAP } from '../lib/cta';

const leaks = [
  {
    title: 'Slow first response',
    result: 'Buyers book with whoever answers first.',
    impact: 'Hours of delay = lost appointments',
  },
  {
    title: 'Missed calls after hours',
    result: 'Urgent jobs never make it onto your calendar.',
    impact: 'Nights & weekends silently leak revenue',
  },
  {
    title: 'Weak follow-up',
    result: 'Warm leads go cold after one attempt.',
    impact: 'Most closes need structured nurture',
  },
  {
    title: 'Unclear next step',
    result: 'Prospects leave without booking.',
    impact: 'Confusion kills conversion',
  },
  {
    title: 'No source visibility',
    result: 'You fund channels that do not convert.',
    impact: 'Higher cost per booked job',
  },
  {
    title: 'Staff overload',
    result: 'Busy days mean missed inquiries.',
    impact: 'Peak demand becomes peak leakage',
  },
];

export default function WhyLoseCustomers() {
  return (
    <section id="why-lose" className="bg-background border-t border-[#1C1C1C]">
      <div className={`${SECTION_WRAP} py-20 md:py-28`}>
        <ScrollReveal className="max-w-[680px] mb-12 md:mb-16">
          <SectionLabel text="WHY BUSINESSES LOSE CUSTOMERS" />
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold text-[#F5F0E8] leading-[1.15] tracking-[-0.015em]">
            The leak is rarely the ad.
            <br />
            It is what happens after.
          </h2>
          <p className="mt-4 text-[#A8A29E] leading-relaxed">
            These six points show up again and again in owner-operated service businesses between $500K and $10M.
          </p>
        </ScrollReveal>

        <ScrollReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5" stagger={0.06}>
          {leaks.map((leak, i) => (
            <article
              key={leak.title}
              className="rounded-xl border border-[#262626] bg-card p-6 md:p-7"
            >
              <p className="text-xs font-mono text-primary mb-3">0{i + 1}</p>
              <h3 className="text-lg font-semibold text-[#F5F0E8]">{leak.title}</h3>
              <p className="mt-2 text-[#A8A29E] leading-relaxed">{leak.result}</p>
              <p className="mt-4 text-sm text-[#6B6560] border-t border-[#1C1C1C] pt-4">
                {leak.impact}
              </p>
            </article>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
