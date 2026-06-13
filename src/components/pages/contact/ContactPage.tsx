import { m as motion } from 'framer-motion'
import { Mail, MapPin, Phone } from 'lucide-react'
import { ContactForm } from './ContactForm'
import { PageHero } from '@/components/pages/PageHero'
import { BrandIcon } from '@/components/SocialLinks'
import { FadeIn, PageTransition, StaggerContainer, StaggerItem, smoothEase } from '@/components/motion'
import { socialLinks } from '@/lib/socialLinks'
import * as m from '@/paraglide/messages'

export function ContactPage() {
    return (
        <PageTransition>
            <ContactHero />
            <ContactContent />
        </PageTransition>
    )
}

function ContactHero() {
    return (
        <PageHero label={m.contact_label()} subtitle={m.contact_subtitle()}>
            {m.contact_heading_1()} <br />
            <span className="text-accent">{m.contact_heading_2()}</span>
        </PageHero>
    )
}

function ContactContent() {
    return (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
            <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
                <ContactInfo />
                <ContactForm />
            </div>
        </section>
    )
}

function ContactInfo() {
    return (
        <FadeIn direction="left">
            <div className="space-y-6 sm:space-y-8">
                <div>
                    <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl">{m.contact_info_heading()}</h2>
                    <p className="text-base text-text-muted sm:text-lg">{m.contact_info_subtitle()}</p>
                </div>

                <StaggerContainer staggerDelay={0.1} className="space-y-0">
                    <StaggerItem>
                        <ContactCard
                            href="mailto:jd@jandrly.cz"
                            icon={<Mail size={24} />}
                            label={m.contact_label_email()}
                            value="jd@jandrly.cz"
                        />
                    </StaggerItem>
                    <StaggerItem>
                        <ContactCard
                            icon={<MapPin size={24} />}
                            label={m.contact_label_location()}
                            value={m.contact_location_value()}
                            hasSeparator
                        />
                    </StaggerItem>
                    <StaggerItem>
                        <ContactCard
                            href="tel:+420735190454"
                            icon={<Phone size={24} />}
                            label={m.contact_label_phone()}
                            value="+420 735 190 454"
                            hasSeparator
                        />
                    </StaggerItem>
                </StaggerContainer>

                <FadeIn delay={0.4}>
                    <div>
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-subtle">{m.contact_follow_me()}</h3>
                        <div className="flex gap-4">
                            {socialLinks.map((link) => (
                                <SocialLink key={link.label} href={link.href} icon={<BrandIcon icon={link.icon} />} label={link.label} />
                            ))}
                        </div>
                    </div>
                </FadeIn>
            </div>
        </FadeIn>
    )
}

interface ContactCardProps {
    href?: string
    icon: React.ReactNode
    label: string
    value: string
    hasSeparator?: boolean
}

function ContactCard({ href, icon, label, value, hasSeparator = false }: ContactCardProps) {
    const content = (
        <>
            <motion.div
                className="flex h-12 w-12 shrink-0 items-center justify-center text-text-subtle transition-colors group-hover:text-accent"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2, ease: smoothEase }}
            >
                {icon}
            </motion.div>
            <div>
                <span className="mb-1 block text-sm font-bold uppercase tracking-wider text-text-subtle">{label}</span>
                <span className="text-xl font-medium">{value}</span>
            </div>
        </>
    )

    const className = `group flex items-start gap-5 py-6 transition-colors sm:py-8 ${
        hasSeparator ? 'border-t border-border hover:border-accent' : ''
    }`

    if (href) {
        return (
            <a href={href} className={className}>
                {content}
            </a>
        )
    }

    return <div className={className}>{content}</div>
}

interface SocialLinkProps {
    href: string
    icon: React.ReactNode
    label: string
}

function SocialLink({ href, icon, label }: SocialLinkProps) {
    return (
        <motion.a
            href={href}
            aria-label={label}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 w-10 items-center justify-center text-white transition-colors hover:text-accent"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: smoothEase }}
        >
            {icon}
        </motion.a>
    )
}
