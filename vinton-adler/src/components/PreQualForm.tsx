import { useState } from 'react';
import { X, Check, ArrowRight, AlertCircle } from 'lucide-react';

interface PreQualFormProps {
  isOpen: boolean;
  onClose: () => void;
  onQualified: () => void;
}

interface FormData {
  businessType: string;
  monthlyRevenue: string;
  weeklyLeads: string;
  missedCalls: string;
  responseSpeed: string;
  leadTracking: string;
  primaryGoal: string;
  investmentReady: string;
}

const INITIAL_DATA: FormData = {
  businessType: '',
  monthlyRevenue: '',
  weeklyLeads: '',
  missedCalls: '',
  responseSpeed: '',
  leadTracking: '',
  primaryGoal: '',
  investmentReady: '',
};

const QUESTIONS = [
  {
    id: 'businessType' as keyof FormData,
    question: 'What type of business do you run?',
    options: [
      'Home Services (HVAC, plumbing, electrical, roofing)',
      'Real Estate (agents, brokers, property management)',
      'Professional Services (legal, accounting, consulting)',
      'Healthcare / Wellness (dental, PT, chiropractic, medspa)',
      'Contracting / Construction',
      'Logistics / Fleet / Transportation',
      'Other service-based business',
    ],
  },
  {
    id: 'monthlyRevenue' as keyof FormData,
    question: 'What is your approximate annual revenue?',
    options: [
      'Under $500,000',
      '$500,000 – $1M',
      '$1M – $3M',
      '$3M – $10M',
      '$10M+',
    ],
  },
  {
    id: 'weeklyLeads' as keyof FormData,
    question: 'How many leads or inbound calls do you get per week?',
    options: [
      'Fewer than 10',
      '10 – 25',
      '25 – 75',
      '75 – 150',
      '150+',
    ],
  },
  {
    id: 'missedCalls' as keyof FormData,
    question: 'What happens when a call goes unanswered?',
    options: [
      'Nothing — we call back when we can',
      'Voicemail — they leave a message',
      'Text-back auto-reply is sent',
      'Call is routed to an answering service',
      'We rarely miss calls',
    ],
  },
  {
    id: 'responseSpeed' as keyof FormData,
    question: 'How fast does your team respond to new leads?',
    options: [
      'Within 5 minutes',
      'Within 30 minutes',
      'Within a few hours',
      'Same day',
      'Next day or longer',
    ],
  },
  {
    id: 'leadTracking' as keyof FormData,
    question: 'Do you know where your leads come from and which convert?',
    options: [
      'Yes — full attribution and conversion tracking',
      'Partial — we track some sources',
      'We ask prospects how they found us',
      'No — we have no visibility into source or conversion',
    ],
  },
  {
    id: 'primaryGoal' as keyof FormData,
    question: 'What is your primary goal right now?',
    options: [
      'Capture more of the leads we already generate',
      'Convert more prospects into booked appointments',
      'Reduce reliance on expensive paid advertising',
      'Build a system that runs without constant oversight',
      'All of the above',
    ],
  },
  {
    id: 'investmentReady' as keyof FormData,
    question: 'If a clear revenue leak is identified, are you prepared to invest in fixing it?',
    options: [
      'Yes — I am ready to move forward if the opportunity is clear',
      'Yes — within the next 30 to 60 days',
      'I need to review with my partner / team first',
      'I am exploring options but not ready to commit',
    ],
  },
];

/*
function isQualified(data: FormData): boolean {
  if (data.monthlyRevenue === 'Under $500,000') return false;
  if (data.investmentReady === 'I am exploring options but not ready to commit') return false;
  if (Object.values(data).some((v) => !v)) return false;
  return true;
}
*/

function getQualificationMessage(data: FormData): { title: string; body: string; action: string } {
  if (data.monthlyRevenue === 'Under $500,000') {
    return {
      title: 'Not a fit at this stage',
      body: 'We typically partner with owner-operated service businesses around $500K–$10M annually. At that scale, conversion leaks are large enough to justify a focused install. Reapply when you are ready.',
      action: 'close',
    };
  }

  if (data.investmentReady === 'I am exploring options but not ready to commit') {
    return {
      title: 'Application received',
      body: 'We prioritize owners ready to act within 30 to 60 days. If that timeline changes, reach out and we will re-evaluate.',
      action: 'deprioritized',
    };
  }

  return {
    title: 'You qualify',
    body: 'Based on your responses, you are a strong fit for the Revenue Diagnostic. We limit each market to 2–3 clients. Next step: book your 20-minute session.',
    action: 'book',
  };
}

export default function PreQualForm({ isOpen, onClose, onQualified }: PreQualFormProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [submitted, setSubmitted] = useState(false);
  const [qualResult, setQualResult] = useState<ReturnType<typeof getQualificationMessage> | null>(null);

  if (!isOpen) return null;

  const handleSelect = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const result = getQualificationMessage(formData);
    setQualResult(result);
    setSubmitted(true);
    if (result.action === 'book') {
      onQualified();
    }
  };

  const allAnswered = Object.values(formData).every((v) => v !== '');
  const progress = Math.round((Object.values(formData).filter((v) => v !== '').length / QUESTIONS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center py-12 px-4">
        <div className="bg-card border border-[#262626] rounded-xl w-full max-w-[640px] relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#6B6560] hover:text-[#F5F0E8] transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {!submitted ? (
            <>
              {/* Header */}
              <div className="p-8 pb-4 border-b border-[#262626]">
                <p className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
                  Revenue Diagnostic
                </p>
                <h2 className="text-2xl font-semibold text-[#F5F0E8] leading-snug">
                  Confirm this is a fit
                </h2>
                <p className="text-sm text-[#A8A29E] mt-2 leading-relaxed">
                  Eight short questions. We limit each market to 2–3 clients so every engagement stays sharp.
                </p>
                <div className="mt-4">
                  <div className="h-1 bg-[#1C1C1C] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#6B6560] mt-1.5">{progress}% complete</p>
                </div>
              </div>

              {/* Questions */}
              <div className="p-8 space-y-8">
                {QUESTIONS.map((q, idx) => (
                  <div key={q.id}>
                    <p className="text-sm font-medium text-[#F5F0E8] mb-3">
                      <span className="text-primary mr-2">{idx + 1}.</span>
                      {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSelect(q.id, opt)}
                          className={`w-full text-left text-sm px-4 py-3 rounded-md border transition-all duration-200 ${
                            formData[q.id] === opt
                              ? 'border-primary bg-[rgba(201,169,98,0.06)] text-[#F5F0E8]'
                              : 'border-[#262626] text-[#A8A29E] hover:border-[#404040] hover:text-[#F5F0E8]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                                formData[q.id] === opt
                                  ? 'border-primary bg-primary'
                                  : 'border-[#404040]'
                              }`}
                            >
                              {formData[q.id] === opt && (
                                <Check className="w-2.5 h-2.5 text-background" />
                              )}
                            </span>
                            {opt}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Submit */}
                <div className="pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    className={`w-full text-base font-semibold px-8 py-4 rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                      allAnswered
                        ? 'bg-primary text-background hover:bg-[#D4B978] hover:shadow-[0_0_30px_rgba(201,169,98,0.25)]'
                        : 'bg-[#1C1C1C] text-[#6B6560] cursor-not-allowed'
                    }`}
                  >
                    Check My Eligibility
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {!allAnswered && (
                    <p className="text-xs text-[#6B6560] text-center mt-3 flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Please answer all questions to proceed
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Result screen */
            <div className="p-8 text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  qualResult?.action === 'book'
                    ? 'bg-[rgba(201,169,98,0.12)]'
                    : 'bg-[rgba(168,162,158,0.08)]'
                }`}
              >
                {qualResult?.action === 'book' ? (
                  <Check className="w-8 h-8 text-primary" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-[#A8A29E]" />
                )}
              </div>

              <h3 className="text-2xl font-semibold text-[#F5F0E8] mb-3">
                {qualResult?.title}
              </h3>
              <p className="text-[15px] text-[#A8A29E] leading-relaxed mb-8">
                {qualResult?.body}
              </p>

              {qualResult?.action === 'book' && (
                <button
                  onClick={onQualified}
                  className="text-base font-semibold bg-primary text-background px-10 py-4 rounded-md hover:bg-[#D4B978] hover:shadow-[0_0_30px_rgba(201,169,98,0.25)] transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
                >
                  Book My Revenue Diagnostic
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {(qualResult?.action === 'close' || qualResult?.action === 'deprioritized') && (
                <button
                  onClick={onClose}
                  className="text-sm font-semibold border border-[#262626] text-[#F5F0E8] px-8 py-3 rounded-md hover:border-primary hover:text-primary transition-all duration-200"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
