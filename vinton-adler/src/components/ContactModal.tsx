import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { X } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CALENDLY_URL = 'https://calendly.com/contact-vintonadler/revenueleakdiagnostic';

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      gsap.set(overlayRef.current, { display: 'flex' });
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out', delay: 0.1 }
      );
    } else {
      document.body.style.overflow = '';
      if (overlayRef.current) {
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
    }
  }, [isOpen]);

  useEffect(() => {
    gsap.set(overlayRef.current, { display: 'none' });
  }, []);

  const calendlySrc = `${CALENDLY_URL}?embed_domain=${encodeURIComponent(window.location.hostname)}&embed_type=Inline`;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="bg-card border border-[#262626] rounded-xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6B6560] hover:text-[#F5F0E8] transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pb-2">
          <h3 className="text-xl font-semibold text-[#F5F0E8] leading-snug">
            Book My Revenue Diagnostic
          </h3>
          <p className="text-sm text-[#A8A29E] mt-2 leading-relaxed">
            Leave knowing exactly where booked appointments are leaking — and what it is costing you.
          </p>
          <p className="text-sm text-primary mt-2 font-medium">
            20 minutes. No prep. No obligation.
          </p>
        </div>

        <div className="px-2 pb-4">
          {CALENDLY_URL.includes('YOUR_USERNAME') ? (
            <div className="bg-background border border-[#262626] rounded-lg p-8 text-center">
              <p className="text-sm text-[#A8A29E]">
                Calendly integration ready.
              </p>
              <p className="text-xs text-[#6B6560] mt-2">
                Replace CALENDLY_URL in ContactModal.tsx with your link.
              </p>
            </div>
          ) : (
            <iframe
              src={calendlySrc}
              width="100%"
              height="580"
              frameBorder="0"
              title="Book a Revenue Leak Diagnostic"
              className="rounded-lg"
            />
          )}
        </div>

        <div className="px-6 pb-6" />
      </div>
    </div>
  );
}
