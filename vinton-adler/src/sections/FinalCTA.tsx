interface FinalCTAProps {
  onBookCall: () => void;
}

export default function FinalCTA({ onBookCall }: FinalCTAProps) {
  return (
    <section className="bg-[#F5F0E8] border-t border-[#E5E0D8]">
      <div className="max-w-[800px] mx-auto px-6 py-24 md:py-32 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A962] mb-6">
          NO OBLIGATIONS - JUST CLARITY
        </p>
        <h2 className="font-display italic text-[clamp(36px,6vw,64px)] text-[#0A0A0A] leading-[1.1] tracking-[-0.02em]">
          Book your free Revenue Leak Diagnostic.
        </h2>
        <p className="text-lg text-[#6B6560] mt-6 max-w-[500px] mx-auto leading-relaxed">
          20 minutes. We will show you exactly where your revenue is leaking and what it is costing you.
        </p>
        <button
          onClick={onBookCall}
          className="mt-10 inline-block text-base font-semibold bg-[#0A0A0A] text-[#F5F0E8] px-12 py-5 rounded-full hover:bg-[#1A1A1A] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all duration-200"
        >
          Find My Revenue Leaks
        </button>
        <p className="text-sm text-[#6B6560] mt-6">
          No sales pressure. Just clarity.
        </p>
      </div>
    </section>
  );
}
