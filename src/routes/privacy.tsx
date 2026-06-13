import { createFileRoute } from '@tanstack/react-router'
import { PageHero } from '@/components/pages/PageHero'
import { PageTransition } from '@/components/motion'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/privacy')({
    head: () => ({
        meta: [
            { title: m.meta_privacy_title() },
            {
                name: 'description',
                content: m.meta_privacy_description(),
            },
            { property: 'og:title', content: m.meta_privacy_title() },
            {
                property: 'og:description',
                content: m.meta_privacy_description(),
            },
        ],
    }),
    component: PrivacyPage,
})

function PrivacyPage() {
    return (
        <PageTransition>
            <main>
                <PageHero label={m.privacy_label()} titleId="privacy-heading" metaText={m.privacy_last_updated()}>
                    {m.privacy_heading()}
                </PageHero>

                <section className="px-4 pb-16 sm:px-6 sm:pb-20">
                    <article className="mx-auto w-full max-w-3xl">
                        <div className="text-lg text-[#aaaaaa]">
                            <p className="mb-8 text-xl text-white">{m.privacy_intro()}</p>

                            <h2 className="mb-4 mt-12 text-xl font-semibold text-white">{m.privacy_section_1_title()}</h2>
                            <p className="mb-6">{m.privacy_section_1_text()}</p>
                            <ul className="mb-8 list-disc space-y-2 pl-6 marker:text-accent">
                                <li>{m.privacy_section_1_item_1()}</li>
                                <li>{m.privacy_section_1_item_2()}</li>
                                <li>{m.privacy_section_1_item_3()}</li>
                            </ul>

                            <h2 className="mb-4 mt-12 text-xl font-semibold text-white">{m.privacy_section_2_title()}</h2>
                            <p className="mb-6">{m.privacy_section_2_text()}</p>

                            <h2 className="mb-4 mt-12 text-xl font-semibold text-white">{m.privacy_section_3_title()}</h2>
                            <p className="mb-6">{m.privacy_section_3_text()}</p>

                            <h2 className="mb-4 mt-12 text-xl font-semibold text-white">{m.privacy_section_4_title()}</h2>
                            <p className="mb-6">{m.privacy_section_4_text()}</p>

                            <h2 className="mb-4 mt-12 text-xl font-semibold text-white">{m.privacy_section_5_title()}</h2>
                            <p className="mb-6">{m.privacy_section_5_text()}</p>
                        </div>
                    </article>
                </section>
            </main>
        </PageTransition>
    )
}
