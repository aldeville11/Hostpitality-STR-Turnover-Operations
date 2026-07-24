import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';

export default function Clients() {
  return (
    <section id="who-we-work-with" className="bg-card border-t border-[#262626]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20 py-20 md:py-28 lg:py-32">
        <ScrollReveal className="text-center max-w-[720px] mx-auto">
          <SectionLabel text="WHO THIS IS FOR" />
          <h2 className="text-[clamp(32px,4vw,48px)] font-semibold text-[#F5F0E8] leading-[1.2] tracking-[-0.01em]">
            You run a real business.<br />
            Your revenue system should be capturing more.
          </h2>
          <p className="text-lg text-[#A8A29E] mt-6 leading-relaxed">
            We work with service businesses and real estate teams generating consistent inbound demand where response speed, follow up, and conversion directly impact revenue.
          </p>
          <p className="text-lg text-[#A8A29E] mt-4 leading-relaxed">
            If there is measurable leakage in your lead flow and you are ready to fix it, this is built for you.
          </p>
        </ScrollReveal>

        <ScrollReveal className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-4 md:gap-x-10 md:gap-y-3 mt-10">
          <p className="text-sm text-[#A8A29E] font-medium">
            <span className="text-primary mr-1">✓</span> Generating $500K to $10M in annual revenue
          </p>
          <p className="text-sm text-[#A8A29E] font-medium">
            <span className="text-primary mr-1">✓</span> Actively investing in growth and performance
          </p>
          <p className="text-sm text-[#A8A29E] font-medium">
            <span className="text-primary mr-1">✓</span> Losing opportunities due to gaps in how inquiries are handled and converted
          </p>
          <p className="text-sm text-[#A8A29E] font-medium">
            <span className="text-primary mr-1">✓</span> Limited availability: only 2 to 3 clients accepted per market
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
