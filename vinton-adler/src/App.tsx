import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [preQualOpen, setPreQualOpen] = useState(false);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
    };
  }, []);

  const openPreQual = () => {
    setPreQualOpen(true);
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'cta_click', {
        event_category: 'engagement',
        event_label: 'Book My Revenue Diagnostic',
      });
    }
    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'Lead');
    }
  };

  const closePreQual = () => setPreQualOpen(false);

  const closeModal = () => setModalOpen(false);

  const handleQualified = () => {
    setPreQualOpen(false);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={
          <HomePage
            modalOpen={modalOpen}
            preQualOpen={preQualOpen}
            openPreQual={openPreQual}
            closePreQual={closePreQual}
            closeModal={closeModal}
            onQualified={handleQualified}
          />
        } />
        <Route path="/services" element={
          <ServicesPage
            openPreQual={openPreQual}
            preQualOpen={preQualOpen}
            closePreQual={closePreQual}
            onQualified={handleQualified}
          />
        } />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Routes>
    </div>
  );
}

export default App;
