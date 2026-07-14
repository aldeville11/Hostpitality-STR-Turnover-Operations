import ScrollReveal from '../components/ScrollReveal';

export default function FramingBanner() {
  return (
    <section className="bg-[#0A0A0A] border-y border-[#1C1C1C] relative">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20 py-12 md:py-16">
        <ScrollReveal className="text-center">
          <p className="text-[clamp(18px,3vw,28px)] font-semibold text-[#F5F0E8] leading-relaxed max-w-[800px] mx-auto">
            The issue is what happens after the lead comes in.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
