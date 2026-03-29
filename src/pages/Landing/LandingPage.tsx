import { useEffect } from 'react'
import { LandingNavbar } from './LandingNavbar'
import { HeroSection } from './HeroSection'
import { SocialProofSection } from './SocialProofSection'
import { FeaturesSection } from './FeaturesSection'
import { OvyvaSection } from './OvyvaSection'
import { BenefitsSection } from './BenefitsSection'
import { TestimonialsSection } from './TestimonialsSection'
import { QuizSection } from './QuizSection'
import { FooterSection } from './FooterSection'

export function LandingPage() {
  useEffect(() => {
    document.title = 'Clini+ | Prontuario Verde — Sistema para Clinicas'
    // Enable smooth scroll for anchor links
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#030608] text-white font-sans overflow-x-hidden">
      <LandingNavbar />
      <HeroSection />
      <SocialProofSection />
      <FeaturesSection />
      <OvyvaSection />
      <BenefitsSection />
      <TestimonialsSection />
      <QuizSection />
      <FooterSection />
    </div>
  )
}
