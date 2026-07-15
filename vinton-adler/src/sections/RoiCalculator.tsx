import { useMemo, useState } from 'react';
import SectionLabel from '../components/SectionLabel';
import ScrollReveal from '../components/ScrollReveal';
import { PRIMARY_CTA, CTA_BUTTON_CLASS, SECTION_WRAP } from '../lib/cta';

interface RoiCalculatorProps {
  onBookCall: () => void;
}

function currency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function RoiCalculator({ onBookCall }: RoiCalculatorProps) {
  const [monthlyInquiries, setMonthlyInquiries] = useState(180);
  const [bookingRate, setBookingRate] = useState(22);
  const [jobValue, setJobValue] = useState(850);
  const [leakPercent, setLeakPercent] = useState(20);

  const model = useMemo(() => {
    const booked = monthlyInquiries * (bookingRate / 100);
    const currentRevenue = booked * jobValue;
    const recoverableJobs = monthlyInquiries * (leakPercent / 100) * (bookingRate / 100);
    // Conservative: recover half of estimated leak at same close profile
    const recoveredJobs = recoverableJobs * 0.5;
    const monthlyOpportunity = recoveredJobs * jobValue;
    const annualOpportunity = monthlyOpportunity * 12;
    return {
      booked: Math.round(booked),
      currentRevenue,
      monthlyOpportunity,
      annualOpportunity,
      recoveredJobs: Math.round(recoveredJobs * 10) / 10,
    };
  }, [monthlyInquiries, bookingRate, jobValue, leakPercent]);

  return (
    <section id="opportunity" className="bg-[#0C0C0C] border-t border-[#1C1C1C]">
      <div className={`${SECTION_WRAP} py-20 md:py-28`}>
        <ScrollReveal className="max-w-[680px] mb-12">
          <SectionLabel text="REVENUE OPPORTUNITY" />
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold text-[#F5F0E8] leading-[1.15] tracking-[-0.015em]">
            Rough the numbers.
            <br />
            See what leakage may be costing you.
          </h2>
          <p className="mt-4 text-[#A8A29E] leading-relaxed">
            This is a planning model — not a guarantee. The Diagnostic validates your actual leak with your real pipeline.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <ScrollReveal className="space-y-6 rounded-xl border border-[#262626] bg-card p-6 md:p-8">
            <Field
              label="Monthly inquiries"
              value={monthlyInquiries}
              min={40}
              max={800}
              step={10}
              onChange={setMonthlyInquiries}
              display={String(monthlyInquiries)}
            />
            <Field
              label="Current booking rate"
              value={bookingRate}
              min={5}
              max={60}
              step={1}
              onChange={setBookingRate}
              display={`${bookingRate}%`}
            />
            <Field
              label="Average job value"
              value={jobValue}
              min={200}
              max={5000}
              step={50}
              onChange={setJobValue}
              display={currency(jobValue)}
            />
            <Field
              label="Estimated inquiry leak"
              value={leakPercent}
              min={5}
              max={40}
              step={1}
              onChange={setLeakPercent}
              display={`${leakPercent}%`}
            />
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <div className="rounded-xl border border-primary/40 bg-card p-7 md:p-9">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary mb-6">
                Conservative recovery estimate
              </p>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#6B6560]">Est. monthly bookings today</p>
                  <p className="text-2xl font-semibold text-[#F5F0E8] mt-1">{model.booked}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B6560]">Est. monthly booked revenue</p>
                  <p className="text-2xl font-semibold text-[#F5F0E8] mt-1">
                    {currency(model.currentRevenue)}
                  </p>
                </div>
                <div className="border-t border-[#1C1C1C] pt-6">
                  <p className="text-sm text-[#6B6560]">Monthly revenue opportunity</p>
                  <p className="text-3xl md:text-4xl font-semibold text-primary mt-1">
                    {currency(model.monthlyOpportunity)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6B6560]">Annualized opportunity</p>
                  <p className="text-2xl font-semibold text-[#F5F0E8] mt-1">
                    {currency(model.annualOpportunity)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onBookCall}
                className={`${CTA_BUTTON_CLASS} mt-8 w-full`}
              >
                {PRIMARY_CTA}
              </button>
              <p className="mt-3 text-xs text-[#6B6560] text-center">
                Validate these numbers on a 20-minute Diagnostic.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  display: string;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-sm text-[#A8A29E]">{label}</span>
        <span className="text-sm font-semibold text-[#F5F0E8] tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[hsl(42,45%,57%)] h-2 rounded-full appearance-none bg-[#1C1C1C] cursor-pointer"
      />
    </label>
  );
}
