import LegalPage from './LegalPage';

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <div className="space-y-8 text-[15px] text-[#A8A29E] leading-relaxed">
        <section>
          <p>
            We collect basic information you submit through forms, email, scheduling tools, and analytics so we can respond to inquiries, deliver services, and improve the website. We do not sell your personal information.
          </p>
        </section>

        <section>
          <p>
            For questions, contact us at{' '}
            <a href="mailto:contact@vintonadler.com" className="text-primary hover:underline">
              contact@vintonadler.com
            </a>
            .
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
