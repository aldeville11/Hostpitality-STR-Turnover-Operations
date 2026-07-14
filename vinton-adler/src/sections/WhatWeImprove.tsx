import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';
import { SECTION_WRAP } from '../lib/cta';

const improvements = [
  {
    outcome: 'Higher booking rates',
    how: 'Tighten intake so more inquiries become calendar events.',
  },
  {
    outcome: 'Faster response',
    how: 'Cut lag from hours to minutes across every channel.',
  },
  {
    outcome: 'Lower acquisition cost',
    how: 'Convert more of the demand you already paid for.',
  },
  {
    outcome: 'Better Google visibility',
    how: 'Show up where ready buyers search — and convert them.',
  },
  {
    outcome: 'Recovered revenue',
    how: 'Missed calls and stalled leads stop dying in silence.',
  },
  {
    outcome: 'More five-star reviews',
    how: 'Clean booking and service loops drive review velocity.',
  },
];

export default function WhatWeImprove() {
  return (
    <section id="improve" className="bg-[#0C0C0C] border-t border-[#1C1C1C]">
      <div className={`${SECTION_WRAP} py-20 md:py-28`}>
        <ScrollReveal className="max-w-[680px] mb-12 md:mb-16">
          <SectionLabel text="WHAT WE IMPROVE" />
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold text-[#F5F0E8] leading-[1.15] tracking-[-0.015em]">
            Outcomes you can measure.
            <br />
            Not tools you have to babysit.
          </h2>
          <p className="mt-4 text-[#A8A29E] leading-relaxed">
            We do not sell software. We sell booked appointments, recovered revenue, and a lower cost to win each job.
          </p>
        </ScrollReveal>

        <ScrollReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5" stagger={0.06}>
          {improvements.map((item) => (
            <article
              key={item.outcome}
              className="rounded-xl border border-[#262626] bg-card p-6 md:p-7"
            >
              <h3 className="text-lg font-semibold text-[#F5F0E8]">{item.outcome}</h3>
              <p className="mt-3 text-[#A8A29E] leading-relaxed">{item.how}</p>
            </article>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
