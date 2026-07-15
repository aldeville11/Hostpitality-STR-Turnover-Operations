import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';
import { SECTION_WRAP } from '../lib/cta';

const steps = [
  {
    step: '01',
    title: 'Diagnose',
    body: 'Map how inquiries move from first contact to booked job. Find the biggest leak. Rank fixes by dollars recovered.',
  },
  {
    step: '02',
    title: 'Install',
    body: 'Rebuild the capture, response, booking, and follow-up system around that leak — without ripping out what already works.',
  },
  {
    step: '03',
    title: 'Optimize',
    body: 'Watch booking rate, response time, and recovered revenue. Tighten what works. Kill what does not.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#0C0C0C] border-t border-[#1C1C1C]">
      <div className={`${SECTION_WRAP} py-20 md:py-28`}>
        <ScrollReveal className="max-w-[680px] mb-12 md:mb-16">
          <SectionLabel text="HOW IT WORKS" />
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold text-[#F5F0E8] leading-[1.15] tracking-[-0.015em]">
            A simple sequence.
            <br />
            Built for speed to bookings.
          </h2>
          <p className="mt-4 text-[#A8A29E] leading-relaxed">
            No long workshops. No 90-page decks. Find the leak. Fix it. Measure the bookings.
          </p>
        </ScrollReveal>

        <ScrollReveal className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6" stagger={0.1}>
          {steps.map((s) => (
            <article
              key={s.step}
              className="rounded-xl border border-[#262626] bg-card p-7 md:p-8"
            >
              <p className="font-mono text-sm text-primary mb-4">{s.step}</p>
              <h3 className="text-2xl font-semibold text-[#F5F0E8]">{s.title}</h3>
              <p className="mt-4 text-[#A8A29E] leading-relaxed">{s.body}</p>
            </article>
          ))}
        </ScrollReveal>

        <ScrollReveal className="mt-12 max-w-[640px]">
          <p className="text-lg text-[#F5F0E8] font-medium leading-snug">
            The businesses that win are not the ones with the most inquiries. They are the ones with the tightest path from inquiry to booked appointment.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
