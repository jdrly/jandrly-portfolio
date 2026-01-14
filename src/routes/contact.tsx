import { createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent, type ChangeEvent } from 'react'
import {
    Mail,
    MapPin,
    Phone,
    Send,
    CheckCircle,
    Instagram,
    Twitter,
    Linkedin,
    Globe,
} from 'lucide-react'

export const Route = createFileRoute('/contact')({
    component: ContactPage,
})

interface FormData {
    name: string
    email: string
    phone: string
    message: string
}

function ContactPage() {
    return (
        <main>
            <ContactHero />
            <ContactContent />
        </main>
    )
}

function ContactHero() {
    return (
        <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-32 text-center">
            {/* Background gradients */}
            <div className="absolute inset-0 z-0 bg-bg">
                <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,80,0.05),transparent_60%)]" />
                <div className="absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(circle_at_80%_80%,rgba(79,70,229,0.05),transparent_60%)]" />
            </div>

            <div className="z-10 mx-auto max-w-4xl">
                {/* Label with decorative lines */}
                <div className="mb-8 flex items-center justify-center gap-3">
                    <span
                        className="h-px w-12 bg-border"
                        aria-hidden="true"
                    />
                    <span className="text-sm font-medium uppercase tracking-widest text-accent">
                        Get in Touch
                    </span>
                    <span
                        className="h-px w-12 bg-border"
                        aria-hidden="true"
                    />
                </div>

                <h1 className="mb-8 text-5xl font-bold leading-[0.9] tracking-tight md:text-7xl lg:text-8xl">
                    Let's build something <br />
                    <span className="text-accent">extraordinary.</span>
                </h1>

                <p className="mx-auto max-w-2xl text-xl leading-relaxed text-text-muted md:text-2xl">
                    Have a project in mind? Looking for a technical partner?
                    I'm always open to discussing new opportunities and ideas.
                </p>
            </div>
        </section>
    )
}

function ContactContent() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-20">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                <ContactInfo />
                <ContactForm />
            </div>
        </section>
    )
}

function ContactInfo() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="mb-4 text-3xl font-bold">Contact Info</h2>
                <p className="text-lg text-text-muted">
                    Feel free to reach out through any of these channels. I
                    typically respond within 24 hours.
                </p>
            </div>

            {/* Contact cards */}
            <div className="space-y-4">
                <ContactCard
                    href="mailto:jd@jandrly.cz"
                    icon={<Mail size={24} />}
                    label="Email"
                    value="jd@jandrly.cz"
                />
                <ContactCard
                    icon={<MapPin size={24} />}
                    label="Location"
                    value="Pardubice, Czechia"
                />
                <ContactCard
                    href="tel:+420123456789"
                    icon={<Phone size={24} />}
                    label="Phone"
                    value="+420 123 456 789"
                />
            </div>

            {/* Social links */}
            <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-subtle">
                    Follow Me
                </h3>
                <div className="flex gap-4">
                    <SocialLink
                        href="#"
                        icon={<Instagram size={20} />}
                        label="Instagram"
                    />
                    <SocialLink
                        href="#"
                        icon={<Twitter size={20} />}
                        label="Twitter"
                    />
                    <SocialLink
                        href="#"
                        icon={<Linkedin size={20} />}
                        label="LinkedIn"
                    />
                    <SocialLink
                        href="#"
                        icon={<Globe size={20} />}
                        label="Website"
                    />
                </div>
            </div>
        </div>
    )
}

interface ContactCardProps {
    href?: string
    icon: React.ReactNode
    label: string
    value: string
}

function ContactCard({ href, icon, label, value }: ContactCardProps) {
    const content = (
        <>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bg-elevated transition-colors group-hover:bg-accent group-hover:text-black">
                {icon}
            </div>
            <div>
                <span className="mb-1 block text-sm font-bold uppercase tracking-wider text-text-subtle">
                    {label}
                </span>
                <span className="text-xl font-medium">{value}</span>
            </div>
        </>
    )

    const className =
        'group flex items-start gap-4 rounded-2xl border border-border-subtle bg-bg-card p-6 transition-colors hover:border-accent'

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
        <a
            href={href}
            aria-label={label}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-border transition-all hover:bg-white hover:text-black"
        >
            {icon}
        </a>
    )
}

function ContactForm() {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        message: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    function handleChange(
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate form submission
        await new Promise((resolve) => setTimeout(resolve, 1500))

        setIsSubmitting(false)
        setIsSubmitted(true)
    }

    if (isSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-border-subtle bg-bg-card p-8 text-center md:p-12">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-black">
                    <CheckCircle size={32} />
                </div>
                <h3 className="mb-2 text-2xl font-bold">Message Sent!</h3>
                <p className="text-text-muted">
                    Thank you for reaching out. I'll get back to you as soon as
                    possible.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-3xl border border-border-subtle bg-bg-card p-8 md:p-12">
            <h2 className="mb-8 text-2xl font-bold">Send a Message</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <FormField
                    id="name"
                    label="Name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

                <FormField
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <FormField
                    id="phone"
                    label="Phone (Optional)"
                    type="tel"
                    placeholder="+420 123 456 789"
                    value={formData.phone}
                    onChange={handleChange}
                />

                <div className="space-y-2">
                    <label
                        htmlFor="message"
                        className="text-sm font-medium uppercase tracking-wider text-text-muted"
                    >
                        Message
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full resize-none rounded-xl border border-border bg-[#0a0a0a] px-4 py-4 text-white transition-colors focus:border-accent focus:outline-none"
                        placeholder="Tell me about your project..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-black transition-all hover:bg-accent hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isSubmitting ? (
                        <span
                            className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                            aria-label="Submitting..."
                        />
                    ) : (
                        <>
                            Send Message <Send size={18} />
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}

interface FormFieldProps {
    id: string
    label: string
    type: string
    placeholder: string
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    required?: boolean
}

function FormField({
    id,
    label,
    type,
    placeholder,
    value,
    onChange,
    required,
}: FormFieldProps) {
    return (
        <div className="space-y-2">
            <label
                htmlFor={id}
                className="text-sm font-medium uppercase tracking-wider text-text-muted"
            >
                {label}
            </label>
            <input
                type={type}
                id={id}
                name={id}
                required={required}
                value={value}
                onChange={onChange}
                className="w-full rounded-xl border border-border bg-[#0a0a0a] px-4 py-4 text-white transition-colors focus:border-accent focus:outline-none"
                placeholder={placeholder}
            />
        </div>
    )
}
