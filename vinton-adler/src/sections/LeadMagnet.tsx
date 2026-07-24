import { useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle, Mail } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

gsap.registerPlugin(ScrollTrigger);

export default function LeadMagnet() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'lead_magnet', {
        event_category: 'engagement',
        event_label: '5 Revenue Leaks Checklist',
      });
    }
    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'Lead');
    }
  };

  return (
    <section className="bg-[#0A0A0A] border-y border-[#1C1C1C]">
      <div className="max-w-[600px] mx-auto px-6 py-14 md:py-20 text-center">
        <ScrollReveal>
          {!submitted ? (
            <>
              <Mail className="w-6 h-6 text-primary mx-auto mb-4" />
              <h3 className="text-xl md:text-2xl font-semibold text-[#F5F0E8] leading-snug">
                Not ready to book? Download the free checklist.
              </h3>
              <p className="text-[15px] text-[#A8A29E] mt-3 leading-relaxed">
                5 revenue leaks most businesses miss. Diagnose yours in 5 minutes.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="flex-1 bg-card border border-[#262626] rounded-md px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#6B6560] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <button
                  type="submit"
                  className="text-sm font-semibold bg-primary text-background px-6 py-3 rounded-md hover:bg-[#D4B978] hover:shadow-[0_0_30px_rgba(201,169,98,0.25)] transition-all duration-200 whitespace-nowrap"
                >
                  Send My Checklist
                </button>
              </form>
              <p className="text-xs text-[#6B6560] mt-3">
                No spam. One checklist. Unsubscribe anytime.
              </p>
            </>
          ) : (
            <div className="py-4">
              <CheckCircle className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#F5F0E8]">Checklist sent.</h3>
              <p className="text-[15px] text-[#A8A29E] mt-2">
                Check your inbox. If you do not see it in 2 minutes, check spam.
              </p>
              <p className="text-sm text-primary mt-4 font-medium">
                Want us to find your leaks for you? Book the diagnostic.
              </p>
            </div>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
}
