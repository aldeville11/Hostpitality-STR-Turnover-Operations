import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';
import { SECTION_WRAP } from '../lib/cta';

const stages = [
  {
    name: 'Capture',
    outcome: 'Every inquiry is logged and owned — calls, forms, chats, after-hours.',
  },
  {
    name: 'Respond',
    outcome: 'Buyers hear back in minutes, not hours — day or night.',
  },
  {
    name: 'Qualify',
    outcome: 'Fit checks happen fast so your team spends time on real jobs.',
  },
  {
    name: 'Book',
    outcome: 'Clear paths to appointment replace “we’ll call you back.”',
  },
  {
    name: 'Follow up',
    outcome: 'Warm prospects stay in a sequence until they book or opt out.',
  },
  {
    name: 'Measure',
    outcome: 'You see booking rate, response time, and recovered revenue — weekly.',
  },
];

export default function AcquisitionSystem() {
  return (
    <section id="system" className="bg-[#0C0C0C] border-t border-[#1C1C1C]">
      <div className={`${SECTION_WRAP} py-20 md:py-28`}>
        <ScrollReveal className="max-w-[720px] mb-12 md:mb-16">
          <SectionLabel text="CUSTOMER ACQUISITION SYSTEM" />
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold text-[#F5F0E8] leading-[1.15] tracking-[-0.015em]">
            One system. One job.
            <br />
            Turn demand into booked appointments.
          </h2>
          <p className="mt-4 text-[#A8A29E] leading-relaxed max-w-[560px]">
            We are not an agency. We are your customer acquisition and revenue operations partner. We redesign how inquiries become revenue — using the demand you already have.
          </p>
        </ScrollReveal>

        <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1C1C1C] rounded-xl overflow-hidden border border-[#1C1C1C]" stagger={0.05}>
          {stages.map((stage, i) => (
            <div key={stage.name} className="bg-[#0C0C0C] p-7 md:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary mb-3">
                Stage {i + 1}
              </p>
              <h3 className="text-xl font-semibold text-[#F5F0E8]">{stage.name}</h3>
              <p className="mt-3 text-[#A8A29E] leading-relaxed">{stage.outcome}</p>
            </div>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
