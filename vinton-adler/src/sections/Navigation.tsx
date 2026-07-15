import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router';
import { PRIMARY_CTA, CTA_BUTTON_CLASS_SM } from '../lib/cta';

interface NavigationProps {
  onBookCall: () => void;
}

const links = [
  { label: 'The Problem', href: '#problem' },
  { label: 'System', href: '#system' },
  { label: 'Packages', href: '#offers' },
  { label: 'Results', href: '#results' },
  { label: 'FAQ', href: '#questions' },
];

export default function Navigation({ onBookCall }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    }
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - headerOffset, behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0A0A0A]/92 backdrop-blur-xl border-b border-[#1C1C1C]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="text-base font-semibold text-[#F5F0E8] tracking-tight">
            Vinton Adler &amp; Co.
          </Link>

          <div className="hidden lg:flex items-center gap-7">
            {links.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollTo(link.href)}
                className="text-sm font-medium text-[#A8A29E] hover:text-[#F5F0E8] transition-colors duration-200"
              >
                {link.label}
              </button>
            ))}
            <button type="button" onClick={onBookCall} className={CTA_BUTTON_CLASS_SM}>
              {PRIMARY_CTA}
            </button>
          </div>

          <button
            type="button"
            className="lg:hidden text-[#F5F0E8] min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-[#0A0A0A]/98 backdrop-blur-xl flex flex-col items-center justify-center gap-7 px-6">
          {links.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => scrollTo(link.href)}
              className="text-xl font-medium text-[#A8A29E] hover:text-[#F5F0E8] transition-colors min-h-[44px]"
            >
              {link.label}
            </button>
          ))}
          <button type="button" onClick={() => { setMobileOpen(false); onBookCall(); }} className={`${CTA_BUTTON_CLASS_SM} mt-2`}>
            {PRIMARY_CTA}
          </button>
        </div>
      ) : null}
    </>
  );
}
