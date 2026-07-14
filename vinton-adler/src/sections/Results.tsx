import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';

const steps = [
  {
    number: '1',
    title: 'Diagnostic',
    description:
      'We analyze your lead flow, response speed, and follow up to identify where opportunities are being lost and where the highest-impact fixes exist.',
  },
  {
    number: '2',
    title: 'Install',
    description:
      'We implement the core systems that capture leads, respond instantly, and ensure no opportunity is missed or delayed.',
  },
  {
    number: '3',
    title: 'Optimize',
    description:
      'We refine performance, improve conversion rates, and continuously strengthen the system so results compound over time.',
  },
];

export default function Results() {
  return (
    <section id="how-it-works" className="bg-background border-t border-[#1C1C1C]">
      <div className="max-w-[800px] mx-auto px-6 md:px-12 lg:px-20 py-20 md:py-28 lg:py-32">
        <ScrollReveal className="text-center mb-12">
          <SectionLabel text="HOW IT WORKS" />
          <h2 className="text-[clamp(32px,4vw,48px)] font-semibold text-[#F5F0E8] leading-[1.2] tracking-[-0.01em]">
            We identify where revenue is being lost, install the systems to capture it, and optimize performance so more of your existing demand turns into booked jobs.
          </h2>
          <p className="text-base text-[#A8A29E] mt-6 leading-relaxed max-w-[720px] mx-auto">
            This is a structured process designed to tighten response speed, strengthen continuation, and improve conversion at every stage of your pipeline.
          </p>
        </ScrollReveal>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <ScrollReveal key={index} delay={index * 0.12}>
              <div className="flex items-start gap-5 bg-card border border-[#262626] rounded-xl p-6 md:p-8">
                <span className="text-2xl font-bold text-primary flex-shrink-0 w-10">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-[#F5F0E8] mb-2">{step.title}</h3>
                  <p className="text-[15px] text-[#A8A29E] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="text-center mt-12">
          <p className="text-lg text-[#F5F0E8] font-medium leading-relaxed max-w-[640px] mx-auto">
            The businesses that win are not the ones with the most inquiries. They are the ones with the tightest process for converting them.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
