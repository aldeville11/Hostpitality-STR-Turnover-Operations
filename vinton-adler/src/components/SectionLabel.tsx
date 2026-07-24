export default function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-px bg-primary" />
      <span className="text-xs font-medium tracking-[0.08em] uppercase text-primary">
        {text}
      </span>
    </div>
  );
}
