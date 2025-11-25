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
    <div className="bg-gray-50">

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