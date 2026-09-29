import { Mail, MapPin, Phone } from 'lucide-react'
import { ContactForm } from './ContactForm'
import type { GlyphId } from '@/components/ui/GlyphWord'
import { useProtectedEmail } from '@/components/ProtectedEmail'
import { ContactDetailRow } from '@/components/ui/ContactDetailRow'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { SocialChip } from '@/components/ui/SocialChip'
import { SITE } from '@/lib/site'
import { keepHyphenatedWords } from '@/lib/typography'
import { socialLinks } from '@/lib/socialLinks'
import * as m from '@/paraglide/messages'

const HERO_GLYPHS: ReadonlyArray<GlyphId> = [11, 8, 6, 1, 0]

/** Mono sub-heading used for "Kontaktní údaje" / "Sledujte mě". */
const SUBHEADING_CLASS = 'font-mono text-label text-ink uppercase'

/**
 * Kontakt — one hero band: intro, contact details and socials on the left, the dark form window on the
 * right (≥ xl). Below xl the form window stacks under the details, as in the mobile design.
 */
export function ContactPage() {
    return (
        <section aria-labelledby="contact-title" className="bg-grain">
            <div className="container-page grid gap-10 pt-[clamp(1.75rem,5.7143vw+0.3571rem,5.5rem)] pb-14 xl:grid-cols-[minmax(0,1fr)_minmax(0,36.25rem)] xl:gap-20 xl:pb-30">
                <ContactInfo />
                <div className="max-sm:-mx-2">
                    <ContactForm />
                </div>
            </div>
        </section>
    )
}

function ContactInfo() {
    return (
        <div className="flex min-w-0 flex-col gap-9 lg:gap-14">
            <div className="flex flex-col gap-5 lg:gap-7">
                <Eyebrow tone="teal" glyphs={HERO_GLYPHS}>
                    {m.contact_eyebrow()}
                </Eyebrow>
                <h1
                    id="contact-title"
                    className="font-display text-[clamp(2.5rem,3.4286vw+1.6643rem,4.75rem)] leading-[0.97] font-black tracking-[-0.037em] text-ink"
                >
                    {m.contact_title()}
                </h1>
                <p className="text-lead text-ink-soft">{m.contact_subtitle()}</p>
            </div>

            <div className="flex flex-col gap-3.5 lg:gap-5">
                <h2 className={SUBHEADING_CLASS}>{m.contact_info_heading()}</h2>
                <p className="text-body text-ink-soft">{keepHyphenatedWords(m.contact_info_subtitle())}</p>
                <ContactDetails />
            </div>

            <div className="flex flex-col gap-3 lg:gap-4">
                <h2 id="contact-social-heading" className={SUBHEADING_CLASS}>
                    {m.contact_follow_me()}
                </h2>
                <ul aria-labelledby="contact-social-heading" className="flex gap-2 lg:gap-3">
                    {socialLinks.map((link) => (
                        <li key={link.label} className="flex min-w-0 flex-1 lg:flex-none">
                            <SocialChip href={link.href} label={link.label} icon={link.icon} className="w-full" />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

function ContactDetails() {
    const email = useProtectedEmail()

    return (
        <div className="border-b-[1.5px] border-ink">
            <ContactDetailRow icon={Mail} label={m.contact_label_email()} value={email.display} href={email.href} />
            <ContactDetailRow icon={MapPin} label={m.contact_label_location()} value={m.contact_location_value()} />
            <ContactDetailRow icon={Phone} label={m.contact_label_phone()} value={SITE.phone.display} href={SITE.phone.href} />
        </div>
    )
}
