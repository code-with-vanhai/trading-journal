'use client';

import HeroSection from './components/landing/HeroSection';
import StatsSection from './components/landing/StatsSection';
import PerformanceSection from './components/landing/PerformanceSection';
import FeaturesSection from './components/landing/FeaturesSection';
import TestimonialsSection from './components/landing/TestimonialsSection';
import PricingSection from './components/landing/PricingSection';
import CTASection from './components/landing/CTASection';
import FooterSection from './components/landing/FooterSection';

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Ambient Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <HeroSection />
      <StatsSection />
      <PerformanceSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}