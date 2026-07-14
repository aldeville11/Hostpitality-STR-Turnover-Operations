import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';
import { SECTION_WRAP } from '../lib/cta';

export default function RevenueLeakProblem() {
  return (
    <section id="problem" className="bg-[#0C0C0C] border-t border-[#1C1C1C]">
      <div className={`${SECTION_WRAP} py-20 md:py-28`}>
        <ScrollReveal className="max-w-[720px]">
          <SectionLabel text="THE REVENUE LEAK PROBLEM" />
          <h2 className="text-[clamp(1.85rem,3.8vw,3rem)] font-semibold text-[#F5F0E8] leading-[1.15] tracking-[-0.015em]">
            You are not short on demand.
            <br />
            You are short on bookings.
          </h2>
          <p className="mt-6 text-lg text-[#A8A29E] leading-relaxed">
            Ads run. The phone rings. Forms submit. Reviews come in.
          </p>
          <p className="mt-4 text-lg text-[#A8A29E] leading-relaxed">
            Then ready buyers wait. Calls go unanswered. Follow-up stalls. Jobs quietly go to the competitor who replies first.
          </p>
          <p className="mt-8 text-xl md:text-2xl font-semibold text-[#F5F0E8] leading-snug">
            That gap between interest and appointment is where your revenue leaks.
          </p>
          <p className="mt-4 text-base text-[#6B6560] leading-relaxed max-w-[540px]">
            Buying more leads does not fix a broken conversion system. It fills a leaky bucket faster — and costs more.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
