import LegalPage from './LegalPage';

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <div className="space-y-8 text-[15px] text-[#A8A29E] leading-relaxed">
        <section>
          <p>
            By using this website, you agree to use it for lawful purposes and understand that service details, pricing, and availability may change. All services are subject to a separate agreement or scope of work.
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
