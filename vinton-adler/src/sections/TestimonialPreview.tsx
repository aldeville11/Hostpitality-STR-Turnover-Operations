import { Quote } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

export default function TestimonialPreview() {
  return (
    <section className="bg-[#0A0A0A] border-t border-[#1C1C1C]">
      <div className="max-w-[900px] mx-auto px-6 py-24 md:py-32 text-center">
        <ScrollReveal>
          <Quote className="w-10 h-10 text-[#C9A962] mx-auto mb-8 opacity-60" />
          <blockquote className="font-display italic text-[clamp(22px,4vw,36px)] text-[#F5F0E8] leading-[1.4] tracking-[-0.01em]">
            "We thought we needed more leads. Turns out we just needed to capture the ones we already had. The system paid for itself in the first month."
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center">
              <span className="text-sm font-semibold text-[#A8A29E]">MR</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[#F5F0E8]">Michael R.</p>
              <p className="text-xs text-[#6B6560]">HVAC Contractor, Midwest</p>
            </div>
          </div>
          <p className="text-xs text-[#6B6560] mt-8">
            Based on internal client patterns. Individual results vary.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
