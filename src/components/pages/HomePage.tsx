import { HomeHero } from '@/components/sections/HomeHero'
import { HomeServicesSection } from '@/components/sections/HomeServicesSection'
import { HomeWorkSection } from '@/components/sections/HomeWorkSection'
import { LetsTalkSection } from '@/components/sections/LetsTalkSection'

export function HomePage() {
    return (
        <>
            <HomeHero />
            <HomeServicesSection />
            <HomeWorkSection />
            <LetsTalkSection />
        </>
    )
}
