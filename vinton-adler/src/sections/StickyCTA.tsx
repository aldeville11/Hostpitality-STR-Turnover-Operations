import { useEffect, useState } from 'react';
import { PRIMARY_CTA, CTA_BUTTON_CLASS_SM } from '../lib/cta';

interface StickyCTAProps {
  onBookCall: () => void;
}

export default function StickyCTA({ onBookCall }: StickyCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroBottom = document.getElementById('hero')?.getBoundingClientRect().bottom || 0;
      const footerTop =
        document.getElementById('footer')?.getBoundingClientRect().top || window.innerHeight;
      setVisible(heroBottom < 0 && footerTop > window.innerHeight + 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-[#262626] transition-transform duration-300 md:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 safe-pb">
        <span className="text-sm font-medium text-[#F5F0E8] truncate">Revenue Diagnostic</span>
        <button type="button" onClick={onBookCall} className={`${CTA_BUTTON_CLASS_SM} shrink-0 px-4`}>
          {PRIMARY_CTA}
        </button>
      </div>
    </div>
  );
}
