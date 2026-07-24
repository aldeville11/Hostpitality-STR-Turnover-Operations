import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { X } from 'lucide-react';

interface ExitIntentProps {
  onBookCall: () => void;
}

export default function ExitIntentModal({ onBookCall }: ExitIntentProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const hasShown = useRef(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem('va_exit_shown');
    if (alreadyShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (hasShown.current) return;
      if (e.clientY < 50) {
        hasShown.current = true;
        sessionStorage.setItem('va_exit_shown', '1');
        setVisible(true);
        if (typeof window.fbq !== 'undefined') {
          window.fbq('track', 'ViewContent', { content_name: 'Exit Intent' });
        }
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (visible && overlayRef.current && panelRef.current) {
      gsap.set(overlayRef.current, { display: 'flex' });
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
    } else if (!visible && overlayRef.current) {
      gsap.to(panelRef.current, {
        opacity: 0,
        y: 20,
        scale: 0.95,
        duration: 0.2,
        ease: 'power2.in',
      });
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.2,
        delay: 0.05,
        ease: 'power2.in',
        onComplete: () => {
          gsap.set(overlayRef.current, { display: 'none' });
        },
      });
    }
  }, [visible]);

  useEffect(() => {
    gsap.set(overlayRef.current, { display: 'none' });
  }, []);

  const handleClose = () => setVisible(false);

  const handleCTA = () => {
    setVisible(false);
    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'Lead');
    }
    onBookCall();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[110] items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div
        ref={panelRef}
        className="bg-card border border-[#262626] rounded-xl w-full max-w-[460px] relative p-8"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#6B6560] hover:text-[#F5F0E8] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <p className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
          Before you go
        </p>
        <h3 className="text-xl font-semibold text-[#F5F0E8] leading-snug">
          Most businesses lose booked jobs after the inquiry — not before.
        </h3>
        <p className="text-sm text-[#A8A29E] mt-3 leading-relaxed">
          See where revenue leaks in 20 minutes. Complimentary for qualified owners.
        </p>

        <button
          onClick={handleCTA}
          className="w-full mt-6 text-sm font-semibold bg-primary text-background py-3.5 min-h-[48px] rounded-md hover:bg-[#D4B978] hover:shadow-[0_0_30px_rgba(201,169,98,0.25)] transition-all duration-200"
        >
          Book My Revenue Diagnostic
        </button>

        <p className="text-xs text-[#6B6560] text-center mt-3">
          No sales pressure. Just clarity.
        </p>
      </div>
    </div>
  );
}
