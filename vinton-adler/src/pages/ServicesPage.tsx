import { Link } from 'react-router';
import { ArrowLeft, Check } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import SectionLabel from '../components/SectionLabel';
import ContactModal from '../components/ContactModal';
import PreQualForm from '../components/PreQualForm';
import ExitIntentModal from '../components/ExitIntentModal';
import { useState } from 'react';
import { PRIMARY_CTA, CTA_BUTTON_CLASS, CTA_BUTTON_CLASS_SM, SECTION_WRAP } from '../lib/cta';

interface ServicesPageProps {
  openPreQual: () => void;
  preQualOpen: boolean;
  closePreQual: () => void;
  onQualified: () => void;
}

const packages = [
  {
    name: 'Customer Acquisition Diagnostic',
    price: 'Complimentary',
    outcome: 'Clarity on where booked appointments leak — and what to fix first.',
    points: ['20-minute revenue map', 'Leak cost estimate', 'Prioritized 30–60 day plan'],
  },
  {
    name: 'Customer Acquisition System',
    price: '$5,500',
    outcome: 'Capture and book more of the demand you already generate.',
    points: ['Missed-call capture', 'Minutes-level response', 'Booking-focused site paths', 'Source-to-booking visibility'],
  },
  {
    name: 'Growth Engine',
    price: '$9,500',
    outcome: 'Full conversion system: qualify, nurture, and book around the clock.',
    points: ['Everything in Acquisition System', 'Always-on qualification', '90-day nurture', '90-day optimization'],
  },
  {
    name: 'Revenue Operations',
    price: '$3,000/mo',
    outcome: 'Continuous operation so booking gains compound instead of decay.',
    points: ['Monthly strategy', 'Active monitoring', 'System upgrades', 'Booking & revenue reporting'],
  },
];

export default function ServicesPage({
  openPreQual,
  preQualOpen,
  closePreQual,
  onQualified,
}: ServicesPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const closeModal = () => setModalOpen(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/92 backdrop-blur-xl border-b border-[#1C1C1C]">
        <div className={`${SECTION_WRAP} flex items-center justify-between h-16 md:h-20`}>
          <Link to="/" className="text-base font-semibold text-[#F5F0E8]">
            Vinton Adler &amp; Co.
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-[#A8A29E] hover:text-[#F5F0E8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <button type="button" onClick={openPreQual} className={CTA_BUTTON_CLASS_SM}>
              {PRIMARY_CTA}
            </button>
          </div>
        </div>
      </nav>

      <div className="h-16 md:h-20" />

      <section className="bg-background">
        <div className={`${SECTION_WRAP} pt-16 md:pt-24 pb-10`}>
          <ScrollReveal className="max-w-[720px]">
            <SectionLabel text="ENGAGEMENTS" />
            <h1 className="text-[clamp(2rem,4vw,3.25rem)] font-semibold text-[#F5F0E8] leading-[1.15] tracking-[-0.015em]">
              Packages built to increase booked appointments.
            </h1>
            <p className="text-lg text-[#A8A29E] mt-5 leading-relaxed">
              We do not sell software catalogs or campaign menus. Every engagement is scoped around conversion — inquiry to booked job.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-background pb-20 md:pb-28">
        <div className={`${SECTION_WRAP} grid grid-cols-1 md:grid-cols-2 gap-5`}>
          {packages.map((pkg) => (
            <ScrollReveal key={pkg.name}>
              <article className="h-full rounded-xl border border-[#262626] bg-card p-7 md:p-8 flex flex-col">
                <div className="flex flex-wrap items-baseline gap-3 mb-3">
                  <h2 className="text-xl font-semibold text-[#F5F0E8]">{pkg.name}</h2>
                  <span className="text-lg font-bold text-primary">{pkg.price}</span>
                </div>
                <p className="text-[#A8A29E] leading-relaxed">{pkg.outcome}</p>
                <ul className="mt-5 space-y-2 flex-1">
                  {pkg.points.map((p) => (
                    <li key={p} className="flex gap-3 text-sm text-[#A8A29E]">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={openPreQual} className={`${CTA_BUTTON_CLASS} mt-7 w-full`}>
                  {PRIMARY_CTA}
                </button>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="bg-card border-t border-[#262626]">
        <div className={`${SECTION_WRAP} py-20 md:py-28 text-center max-w-[720px]`}>
          <ScrollReveal>
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold text-[#F5F0E8] leading-[1.2]">
              Start with the Diagnostic. Install only what pays for itself in bookings.
            </h2>
            <button type="button" onClick={openPreQual} className={`${CTA_BUTTON_CLASS} mt-8 w-full sm:w-auto`}>
              {PRIMARY_CTA}
            </button>
          </ScrollReveal>
        </div>
      </section>

      <footer className="bg-background border-t border-[#1C1C1C]">
        <div className={`${SECTION_WRAP} py-12 flex flex-col md:flex-row items-center justify-between gap-6`}>
          <p className="text-sm text-[#6B6560]">
            &copy; {new Date().getFullYear()} Vinton Adler &amp; Co. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm text-[#6B6560] hover:text-[#A8A29E] transition-colors">
              Home
            </Link>
            <a
              href="mailto:contact@vintonadler.com"
              className="text-sm text-[#6B6560] hover:text-[#A8A29E] transition-colors"
            >
              contact@vintonadler.com
            </a>
          </div>
        </div>
      </footer>

      <PreQualForm isOpen={preQualOpen} onClose={closePreQual} onQualified={onQualified} />
      <ContactModal isOpen={modalOpen} onClose={closeModal} />
      <ExitIntentModal onBookCall={openPreQual} />
    </>
  );
}
