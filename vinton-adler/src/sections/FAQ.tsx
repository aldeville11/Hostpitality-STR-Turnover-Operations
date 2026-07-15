import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';
import { SECTION_WRAP } from '../lib/cta';

const faqs = [
  {
    q: 'Why not just buy more ads?',
    a: 'More ads fill a leaky system faster. If you lose 10–30% of inquiries before booking, every new lead dollar leaks too. Fix conversion first. Then ads compound.',
  },
  {
    q: 'Why can’t my current staff do this?',
    a: 'Your team is built to take jobs — not redesign the revenue system. We install the capture, response, and follow-up standards so staff execute without inventing process under pressure.',
  },
  {
    q: 'Will this work for my business?',
    a: 'If you are an owner-operated service business roughly $500K–$10M with consistent inbound demand, yes. HVAC, trades, restoration, med spa, dental, legal, and home services are core fits. The Diagnostic confirms fit in 20 minutes.',
  },
  {
    q: 'How quickly will I see results?',
    a: 'Most clients see response and booking gains inside 30 days. Full install impact typically shows in 30–60 days. The Diagnostic names the fastest revenue lever first.',
  },
  {
    q: 'Do I need new software?',
    a: 'Not to start. We work with what you have when it can convert. If a tool change is required, it is justified by booked appointments — never by novelty.',
  },
  {
    q: 'How is this different from an agency?',
    a: 'Agencies sell more demand. We redesign how demand becomes booked revenue. Our success metric is appointments and recovered income — not impressions, vanity traffic, or “campaigns shipped.”',
  },
  {
    q: 'What if I already have a marketing person?',
    a: 'That is often ideal. We partner with your team. They can keep sourcing demand while we fix the system that turns it into booked jobs.',
  },
  {
    q: 'What happens after the Diagnostic?',
    a: 'You leave with a clear leak map and a recommended path. If we both see a fit, we discuss Customer Acquisition System, Growth Engine, or Revenue Operations. There is no obligation.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="questions" className="bg-background border-t border-[#1C1C1C]">
      <div className={`${SECTION_WRAP} py-20 md:py-28`}>
        <ScrollReveal className="max-w-[680px] mb-12">
          <SectionLabel text="FAQ" />
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold text-[#F5F0E8] leading-[1.15] tracking-[-0.015em]">
            Questions owners ask before they book.
          </h2>
        </ScrollReveal>

        <ScrollReveal className="max-w-[800px] space-y-3">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="rounded-xl border border-[#262626] bg-card overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left min-h-[56px]"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-medium text-[#F5F0E8] pr-2">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-primary shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen ? (
                  <div className="px-5 sm:px-6 pb-5">
                    <p className="text-[#A8A29E] leading-relaxed">{item.a}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </ScrollReveal>
      </div>
    </section>
  );
}
