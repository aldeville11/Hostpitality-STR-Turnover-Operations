import { Check } from 'lucide-react';
import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';
import { PRIMARY_CTA, CTA_BUTTON_CLASS, SECTION_WRAP } from '../lib/cta';

interface ServicesProps {
  onBookCall: () => void;
}

const packages = [
  {
    name: 'Customer Acquisition Diagnostic',
    forWho: 'Owners who need clarity before spending more on growth.',
    price: 'Complimentary',
    priceNote: '',
    outcome: 'Know exactly where booked revenue is leaking — and what to fix first.',
    impact: 'Stops guessing. Starts the highest-ROI move.',
    features: [
      'Map intake, response, and follow-up in 20 minutes',
      'Quantify drop-off before booking',
      'Prioritized fix list for the next 30–60 days',
    ],
    featured: false,
  },
  {
    name: 'Customer Acquisition System',
    forWho: 'Businesses losing jobs after the inquiry arrives.',
    price: '$5,500',
    priceNote: 'one-time',
    outcome: 'Capture and book more of the demand you already generate.',
    impact: 'Lower cost per booked job from existing spend.',
    features: [
      'Missed-call and after-hours capture',
      'Minutes-not-hours response standards',
      'Local visibility where buyers search',
      'Site paths that convert to appointments',
      'Source tracking tied to bookings',
    ],
    featured: false,
  },
  {
    name: 'Growth Engine',
    forWho: 'Owners ready for a full conversion system — not another campaign.',
    price: '$9,500',
    priceNote: 'one-time',
    outcome: 'Qualify, nurture, and book around the clock from every channel.',
    impact: 'More appointments without proportionally more ad spend.',
    features: [
      'Everything in Customer Acquisition System',
      'Always-on qualification and booking',
      '90-day multi-channel nurture',
      'Conversion rebuild of your primary site path',
      'Managed pipeline with clear next steps',
      '90 days of performance optimization',
    ],
    featured: true,
  },
  {
    name: 'Revenue Operations',
    forWho: 'Teams that need the system operated and improved monthly.',
    price: '$3,000',
    priceNote: 'per month',
    outcome: 'Continuous improvement so booking rates compound over time.',
    impact: 'Protects gains. Prevents decay.',
    features: [
      'Monthly strategy and priority session',
      'Active monitoring before leaks cost jobs',
      'One material system upgrade each month',
      'Visibility and review pipeline support',
      'Monthly booking and revenue report',
    ],
    featured: false,
    note: 'Requires Customer Acquisition System or Growth Engine.',
  },
];

export default function Services({ onBookCall }: ServicesProps) {
  return (
    <section id="offers" className="bg-background border-t border-[#1C1C1C]">
      <div className={`${SECTION_WRAP} py-20 md:py-28`}>
        <ScrollReveal className="max-w-[720px] mb-12 md:mb-16">
          <SectionLabel text="SERVICE PACKAGES" />
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold text-[#F5F0E8] leading-[1.15] tracking-[-0.015em]">
            Engagements built around bookings — not deliverables for show.
          </h2>
          <p className="mt-4 text-[#A8A29E] leading-relaxed">
            Every package has a clear buyer, a clear outcome, and a business impact you can feel in the schedule.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          {packages.map((pkg, index) => (
            <ScrollReveal key={pkg.name} delay={index * 0.06}>
              <article
                className={`h-full rounded-xl border bg-card p-7 md:p-8 flex flex-col ${
                  pkg.featured ? 'border-primary border-2' : 'border-[#262626]'
                }`}
              >
                {pkg.featured && (
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary mb-3">
                    Most chosen
                  </p>
                )}
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                  <h3 className="text-xl md:text-2xl font-semibold text-[#F5F0E8]">{pkg.name}</h3>
                  <span className={`text-xl font-bold ${pkg.featured ? 'text-primary' : 'text-[#F5F0E8]'}`}>
                    {pkg.price}
                  </span>
                  {pkg.priceNote ? (
                    <span className="text-sm text-[#6B6560]">{pkg.priceNote}</span>
                  ) : null}
                </div>
                <p className="text-sm text-[#6B6560] mb-4">
                  <span className="text-[#A8A29E]">For:</span> {pkg.forWho}
                </p>
                <p className="text-[#F5F0E8] font-medium leading-relaxed">{pkg.outcome}</p>
                <p className="mt-2 text-sm text-primary">{pkg.impact}</p>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-[#A8A29E]">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {pkg.note ? (
                  <p className="mt-4 text-sm text-[#6B6560]">{pkg.note}</p>
                ) : null}
                <button
                  type="button"
                  onClick={onBookCall}
                  className={
                    pkg.featured
                      ? `${CTA_BUTTON_CLASS} mt-7 w-full`
                      : 'mt-7 w-full text-sm font-semibold border border-[#262626] text-[#F5F0E8] px-6 py-3 min-h-[48px] rounded-md hover:border-primary hover:text-primary transition-all duration-200'
                  }
                >
                  {PRIMARY_CTA}
                </button>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="mt-10 text-center space-y-2">
          <p className="text-sm text-[#A8A29E]">
            Install engagements include 30–90 days of implementation support.
          </p>
          <p className="text-sm text-[#6B6560]">
            We limit each market to 2–3 clients so attention stays sharp.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
