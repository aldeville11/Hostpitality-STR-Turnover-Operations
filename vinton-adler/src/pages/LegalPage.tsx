import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function LegalPage({ title, lastUpdated = 'January 2026', children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[800px] mx-auto px-6 md:px-12 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#A8A29E] hover:text-primary transition-colors duration-200 mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-[clamp(28px,4vw,40px)] font-semibold text-[#F5F0E8] leading-[1.2] tracking-[-0.01em]">
          {title}
        </h1>
        <p className="text-sm text-[#6B6560] mt-2 mb-12">
          Last updated: {lastUpdated}
        </p>

        <div className="prose prose-invert max-w-none">
          {children}
        </div>

        <div className="mt-16 pt-8 border-t border-[#262626]">
          <p className="text-sm text-[#6B6560]">
            © 2026 Vinton Adler & Co. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
