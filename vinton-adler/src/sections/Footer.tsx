import { Link } from 'react-router';
import { PRIMARY_CTA, CTA_BUTTON_CLASS_SM, SECTION_WRAP } from '../lib/cta';

interface FooterProps {
  onBookCall?: () => void;
}

export default function Footer({ onBookCall }: FooterProps) {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - headerOffset, behavior: 'smooth' });
    }
  };

  return (
    <footer id="footer" className="bg-card border-t border-[#262626]">
      <div className={`${SECTION_WRAP} py-16 md:py-20`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <p className="text-base font-semibold text-[#F5F0E8]">Vinton Adler &amp; Co.</p>
            <p className="text-sm text-[#A8A29E] mt-3 leading-relaxed">
              Customer acquisition &amp; revenue operations partner for owner-operated service businesses.
            </p>
            <p className="text-sm text-[#A8A29E] mt-2 leading-relaxed">
              We redesign the systems behind bookings — so more of the demand you already have becomes paid jobs.
            </p>
            {onBookCall ? (
              <button type="button" onClick={onBookCall} className={`${CTA_BUTTON_CLASS_SM} mt-6`}>
                {PRIMARY_CTA}
              </button>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B6560] mb-4">Navigate</p>
            <ul className="space-y-3">
              {[
                ['#problem', 'The Problem'],
                ['#system', 'System'],
                ['#offers', 'Packages'],
                ['#results', 'Results'],
                ['#questions', 'FAQ'],
              ].map(([href, label]) => (
                <li key={href}>
                  <button
                    type="button"
                    onClick={() => scrollTo(href)}
                    className="text-sm text-[#A8A29E] hover:text-[#F5F0E8] transition-colors duration-200"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B6560] mb-4">Contact</p>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@vintonadler.com"
                  className="text-sm text-[#A8A29E] hover:text-primary transition-colors duration-200"
                >
                  contact@vintonadler.com
                </a>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-[#A8A29E] hover:text-[#F5F0E8] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-[#A8A29E] hover:text-[#F5F0E8] transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[#262626]">
          <p className="text-sm text-[#6B6560] text-center">
            © {new Date().getFullYear()} Vinton Adler &amp; Co. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
