import { LandingNavbar } from './LandingNavbar'
import { HeroSection } from './HeroSection'
import { SocialProofSection } from './SocialProofSection'
import { FeaturesSection } from './FeaturesSection'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030608] text-white font-sans overflow-x-hidden">
      <LandingNavbar />
      <HeroSection />
      <SocialProofSection />
      <FeaturesSection />
    </div>
  )
}
