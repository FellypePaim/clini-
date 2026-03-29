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
