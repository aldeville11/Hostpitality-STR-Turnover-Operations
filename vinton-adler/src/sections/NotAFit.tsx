import { X } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

export default function NotAFit() {
  return (
    <section className="bg-card border-t border-[#262626]">
      <div className="max-w-[700px] mx-auto px-6 py-16 md:py-20 text-center">
        <ScrollReveal>
          <h3 className="text-xl font-semibold text-[#F5F0E8] mb-6">
            This is not for you if:
          </h3>
          <div className="space-y-4 text-left">
            {[
              'You do not have consistent inbound leads',
              'You are not tracking any part of your funnel',
              'You are not ready to act on what we find',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-background border border-[#262626] rounded-lg p-5">
                <X className="w-5 h-5 text-[#6B6560] flex-shrink-0 mt-0.5" />
                <span className="text-[15px] text-[#A8A29E]">{item}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
