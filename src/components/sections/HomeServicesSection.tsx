import type { GlyphId } from '@/components/ui/GlyphWord'
import { ArrowLink } from '@/components/ui/ArrowLink'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { ServiceRow } from '@/components/ui/ServiceRow'
import { StarOrnament } from '@/components/ui/StarOrnament'
import * as m from '@/paraglide/messages'

interface HomeService {
    index: string
    code: string
    glyphs: ReadonlyArray<GlyphId>
    title: () => string
    description: () => string
}

const HOME_SERVICES: ReadonlyArray<HomeService> = [
    { index: '01', code: 'WEB.APP', glyphs: [10, 11, 2], title: m.service_webapp_title, description: m.service_webapp_desc },
    { index: '02', code: 'SYS.API', glyphs: [12, 6, 13, 3], title: m.service_backend_title, description: m.service_backend_desc },
    { index: '03', code: 'AUTO.OPS', glyphs: [5, 4, 0], title: m.service_automation_title, description: m.service_automation_desc },
    { index: '04', code: 'WEB.CMS', glyphs: [7, 9, 8], title: m.service_frontend_title, description: m.service_frontend_desc },
]

/** "[02] Služby" — header (title · intro · star ornament) and the four ruled service rows. */
export function HomeServicesSection() {
    return (
        <section aria-labelledby="home-services-heading" className="bg-grain">
            <div className="container-page flex flex-col gap-[clamp(2.25rem,2.6667vw+1.6rem,4rem)] pt-[clamp(4rem,3.8095vw+3.0714rem,6.5rem)] pb-[clamp(4.5rem,3.8095vw+3.5714rem,7rem)]">
                <div className="flex flex-col gap-[18px] lg:flex-row lg:items-end lg:gap-12 xl:gap-20">
                    <div className="flex min-w-0 flex-1 flex-col gap-[18px] lg:gap-5">
                        <Eyebrow>{m.home_services_eyebrow()}</Eyebrow>
                        <h2
                            id="home-services-heading"
                            className="font-display text-home-title whitespace-pre-line text-ink lg:leading-[0.95] lg:tracking-[-0.0357em]"
                        >
                            {m.home_services_title()}
                        </h2>
                    </div>
                    <p className="text-lead text-ink lg:w-[22rem] lg:shrink-0 xl:w-[27.5rem]">{m.benefits_heading()}</p>
                    {/* Only from 90rem: between xl and 90rem the ornament squeezes the title column below the width of "Od návrhu" / "From design". */}
                    <StarOrnament className="hidden min-[90rem]:block" />
                </div>

                <ul className="border-b-[1.5px] border-ink">
                    {HOME_SERVICES.map((service) => (
                        <li key={service.index}>
                            <ServiceRow
                                index={service.index}
                                code={service.code}
                                glyphs={service.glyphs}
                                title={service.title()}
                                description={service.description()}
                            />
                        </li>
                    ))}
                </ul>

                <ArrowLink to="/services" className="-mt-2 self-end lg:-mt-6">
                    {m.home_services_link()}
                </ArrowLink>
            </div>
        </section>
    )
}
