import Navigation from '../sections/Navigation';
import Hero from '../sections/Hero';
import SocialProof from '../sections/SocialProof';
import RevenueLeakProblem from '../sections/RevenueLeakProblem';
import WhyLoseCustomers from '../sections/WhyLoseCustomers';
import AcquisitionSystem from '../sections/AcquisitionSystem';
import Diagnostic from '../sections/Diagnostic';
import WhatWeImprove from '../sections/WhatWeImprove';
import Services from '../sections/Services';
import HowItWorks from '../sections/HowItWorks';
import CaseStudy from '../sections/CaseStudy';
import RoiCalculator from '../sections/RoiCalculator';
import FAQ from '../sections/FAQ';
import CTA from '../sections/CTA';
import Footer from '../sections/Footer';
import StickyCTA from '../sections/StickyCTA';
import ContactModal from '../components/ContactModal';
import PreQualForm from '../components/PreQualForm';
import ExitIntentModal from '../components/ExitIntentModal';

interface HomePageProps {
  modalOpen: boolean;
  preQualOpen: boolean;
  openPreQual: () => void;
  closePreQual: () => void;
  closeModal: () => void;
  onQualified: () => void;
}

export default function HomePage({
  modalOpen,
  preQualOpen,
  openPreQual,
  closePreQual,
  closeModal,
  onQualified,
}: HomePageProps) {
  return (
    <>
      <Navigation onBookCall={openPreQual} />
      <main>
        <Hero onBookCall={openPreQual} />
        <SocialProof />
        <RevenueLeakProblem />
        <WhyLoseCustomers />
        <AcquisitionSystem />
        <Diagnostic onBookCall={openPreQual} />
        <WhatWeImprove />
        <Services onBookCall={openPreQual} />
        <HowItWorks />
        <CaseStudy onBookCall={openPreQual} />
        <RoiCalculator onBookCall={openPreQual} />
        <FAQ />
        <CTA onBookCall={openPreQual} />
      </main>
      <Footer onBookCall={openPreQual} />
      <StickyCTA onBookCall={openPreQual} />
      <PreQualForm isOpen={preQualOpen} onClose={closePreQual} onQualified={onQualified} />
      <ContactModal isOpen={modalOpen} onClose={closeModal} />
      <ExitIntentModal onBookCall={openPreQual} />
    </>
  );
}
