import { Mail, MapPin, Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { Barcode } from '@/components/ui/Barcode'
import { BARCODE_PATTERNS } from '@/components/ui/barcodePatterns'
import { Button, ButtonLink } from '@/components/ui/Button'
import { CaseCard } from '@/components/ui/CaseCard'
import { CodeTag } from '@/components/ui/CodeTag'
import { ContactDetailRow } from '@/components/ui/ContactDetailRow'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { FormField } from '@/components/ui/FormField'
import { GlyphName } from '@/components/ui/GlyphName'
import { GlyphWord } from '@/components/ui/GlyphWord'
import { GLYPH_WORDS } from '@/components/ui/glyphWords'
import { NamePlate } from '@/components/ui/NamePlate'
import { ProcessStep } from '@/components/ui/ProcessStep'
import { ServiceRow } from '@/components/ui/ServiceRow'
import { SocialChip } from '@/components/ui/SocialChip'
import { Sparkles } from '@/components/ui/Sparkles'
import { StandardItem } from '@/components/ui/StandardItem'
import { StarOrnament } from '@/components/ui/StarOrnament'
import { Stat } from '@/components/ui/Stat'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { TechCell } from '@/components/ui/TechCell'
import { socialLinks } from '@/lib/socialLinks'
import { SITE } from '@/lib/site'
import * as m from '@/paraglide/messages'

/*
 * Dev-only reference page. Labels describing the system itself are English on purpose (not user-facing);
 * sample content comes from the real paraglide messages.
 */

interface TypeStyle {
    name: string
    spec: string
    mobile: string
    className: string
    sample: () => string
}

const TYPE_SCALE: ReadonlyArray<TypeStyle> = [
    {
        name: 'Display 2XL',
        spec: 'text-display-2xl · Archivo 900 · 168 / 0.9 · −6',
        mobile: '96 / 0.88',
        className: 'font-display text-display-2xl',
        sample: () => 'JAN DRLÝ',
    },
    {
        name: 'Display XL',
        spec: 'text-display-xl · Archivo 900 · 120 / 0.92 · −5',
        mobile: '96 / 0.88',
        className: 'font-display text-display-xl',
        sample: () => 'JAN / DRLÝ',
    },
    { name: 'H1', spec: 'text-h1 · Archivo 900 · 80 / 0.96 · −3', mobile: '40 / 0.98', className: 'text-h1', sample: m.process_heading },
    { name: 'H2', spec: 'text-h2 · Archivo 900 · 64 / 0.98 · −2.2', mobile: '36 / 0.98', className: 'text-h2', sample: m.benefits_label },
    {
        name: 'H3',
        spec: 'text-h3 · Archivo 800 · 50 / 1.02 · −1.5',
        mobile: '38 / 1.02',
        className: 'text-h3',
        sample: () => 'Software, který zapadne do provozu.',
    },
    { name: 'H4', spec: 'text-h4 · Archivo 800 · 34 / 1.1 · −1', mobile: '26 / 1.1', className: 'text-h4', sample: m.service_webapp_title },
    {
        name: 'Title',
        spec: 'text-title · Archivo 800 · 30 / 1.12 · −0.8',
        mobile: '24 / 1.12',
        className: 'text-title',
        sample: m.work_example_webapp_title,
    },
    {
        name: 'H5',
        spec: 'text-h5 · Archivo 800 · 26 / 1.15 · −0.6',
        mobile: '22 / 1.15',
        className: 'text-h5',
        sample: m.process_step_2_title,
    },
    { name: 'H6', spec: 'text-h6 · Archivo 800 · 24 / 1.15 · −0.5', mobile: '22', className: 'text-h6', sample: m.cta_proof_1_title },
    { name: 'Stat', spec: 'text-stat · Archivo 900 · 88 / 0.9 · −3', mobile: '56 / 0.9', className: 'text-stat', sample: () => '32' },
    { name: 'Cell', spec: 'text-cell · Archivo 800 · 38 · −1', mobile: '22', className: 'text-cell', sample: () => 'PostgreSQL' },
    {
        name: 'Value',
        spec: 'text-value · Archivo 700 · 26 · −0.4',
        mobile: '22',
        className: 'text-value',
        sample: () => 'hello@example.com',
    },
    { name: 'Lead', spec: 'text-lead · Archivo 400 · 19 / 1.5', mobile: '17 / 1.5', className: 'text-lead', sample: m.about_hero_subtitle },
    {
        name: 'Body',
        spec: 'text-body · Archivo 400 · 17 / 1.55',
        mobile: '16 / 1.55',
        className: 'text-body text-ink-soft',
        sample: m.service_webapp_desc,
    },
    {
        name: 'Body S',
        spec: 'text-body-sm · Archivo 400 · 16 / 1.55',
        mobile: '16 / 1.55',
        className: 'text-body-sm text-ink-soft',
        sample: m.cta_proof_1_desc,
    },
    {
        name: 'Mono / Label',
        spec: 'text-label · JetBrains Mono 700 · 13 · +1 · caps',
        mobile: '12',
        className: 'font-mono text-label text-teal-ink uppercase',
        sample: () => '[02] Služby  ·  Výstup →  ·  Popsat projekt',
    },
    {
        name: 'Mono / Label L',
        spec: 'text-label-lg · JetBrains Mono 600 · 15 · +1',
        mobile: '14',
        className: 'font-mono text-label-lg',
        sample: () => 'S.01  ·  S.02  ·  S.03',
    },
    {
        name: 'Mono / Button',
        spec: 'text-button · JetBrains Mono 700 · 16 · +1.5 · caps',
        mobile: '15',
        className: 'font-mono text-button uppercase',
        sample: m.cta_button,
    },
    {
        name: 'Mono / Code',
        spec: 'text-code · JetBrains Mono 400 · 13 / 1.5 · +0.2',
        mobile: '12',
        className: 'font-mono text-code',
        sample: () => "SELECT služby FROM jandrly.cz WHERE typ = 'na míru';",
    },
    {
        name: 'Mono / Index',
        spec: 'text-index · JetBrains Mono 500 · 40 / 1',
        mobile: '28',
        className: 'font-mono text-index text-tan',
        sample: () => '01  02  03  04',
    },
    {
        name: 'Mono / Index L',
        spec: 'text-index-lg · JetBrains Mono 500 · 56 / 1',
        mobile: '26',
        className: 'font-mono text-index-lg text-teal',
        sample: () => '01  02',
    },
]

interface Swatch {
    token: string
    hex: string
    use: string
    className: string
    dark?: boolean
}

const SWATCHES: ReadonlyArray<Swatch> = [
    { token: 'ink', hex: '#16191A', use: 'Headings, body', className: 'bg-ink' },
    { token: 'ink-soft', hex: '#434B4A', use: 'Secondary body', className: 'bg-ink-soft' },
    { token: 'teal-ink', hex: '#1F5E66', use: 'Labels on light', className: 'bg-teal-ink' },
    { token: 'tan', hex: '#8A6446', use: 'Indexes, accents', className: 'bg-tan' },
    { token: 'teal', hex: '#3F8D97', use: 'Sparkles', className: 'bg-teal' },
    { token: 'coral', hex: '#E8603F', use: 'Primary CTA', className: 'bg-coral' },
    { token: 'paper', hex: '#E6ECEA', use: 'Page background', className: 'bg-paper', dark: true },
    { token: 'paper-warm', hex: '#F1E6DE', use: 'Warm paper', className: 'bg-paper-warm', dark: true },
    { token: 'on-dark', hex: '#B9C2C0', use: 'Body on dark', className: 'bg-on-dark', dark: true },
    { token: 'on-dark-label', hex: '#7FC3CB', use: 'Labels on dark', className: 'bg-on-dark-label', dark: true },
    { token: 'on-dark-muted', hex: '#8E9896', use: 'Hints on dark', className: 'bg-on-dark-muted', dark: true },
    { token: 'line-dark', hex: '#3A4241', use: 'Rules on dark', className: 'bg-line-dark' },
    { token: 'line-dark-strong', hex: '#5A6462', use: 'Inputs, bars on dark', className: 'bg-line-dark-strong' },
    { token: 'success', hex: '#2E9E5B', use: 'Status dot', className: 'bg-success' },
]

/** Specimen form: a function `action` keeps submits in the page (no navigation) without `preventDefault`. */
function ignoreSubmit() {}

function BoardSection({ title, children, dark = false }: { title: string; children: ReactNode; dark?: boolean }) {
    return (
        <section className={dark ? 'bg-grain-dark text-paper' : 'bg-grain'}>
            <div className="container-page flex flex-col gap-section-gap py-section">
                <Eyebrow tone={dark ? 'on-dark' : 'tan'} as="h2">
                    {title}
                </Eyebrow>
                {children}
            </div>
        </section>
    )
}

function Specimen({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
    return (
        <div className={className}>
            <p className="mb-3 font-mono text-code text-ink-soft">{label}</p>
            {children}
        </div>
    )
}

function DarkSpecimen({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
    return (
        <div className={className}>
            <p className="mb-3 font-mono text-code text-on-dark-muted">{label}</p>
            {children}
        </div>
    )
}

export function StyleguidePage() {
    return (
        <>
            <section className="bg-grain">
                <div className="container-page flex flex-col gap-4 pt-section pb-10">
                    <p className="font-mono text-label text-teal-ink uppercase">Design system / jandrly</p>
                    <h1 className="text-h1">Styleguide</h1>
                    <p className="max-w-2xl text-lead text-ink-soft">
                        Tokens, fluid type scale (390 → 1440 px) and every reusable component from personal.pen. Resize the window to see
                        the interpolation.
                    </p>
                </div>
            </section>

            <BoardSection title="Families">
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="flex flex-col gap-4 border-[1.5px] border-ink p-6">
                        <p className="font-mono text-label text-tan uppercase">Display + body · 400–900</p>
                        <p className="font-display text-[8rem] leading-none font-black tracking-[-0.03em]">Aa</p>
                        <p className="text-h5">Archivo</p>
                    </div>
                    <div className="flex flex-col gap-4 border-[1.5px] border-ink p-6">
                        <p className="font-mono text-label text-tan uppercase">Labels + code · 400–700</p>
                        <p className="font-mono text-[8rem] leading-none font-medium tracking-[-0.03em]">Aa</p>
                        <p className="text-h5">JetBrains Mono</p>
                    </div>
                    <div className="bg-grain-dark flex flex-col gap-4 p-6 text-paper">
                        <p className="font-mono text-label text-on-dark-label uppercase">Decor only · no meaning</p>
                        <GlyphWord glyphs={GLYPH_WORDS.name} className="py-8 text-[clamp(1.75rem,2.4vw,3.25rem)] text-paper" />
                        <p className="text-h5">Glyph Script</p>
                    </div>
                </div>
            </BoardSection>

            <BoardSection title="Type scale — desktop (mobile)">
                <div className="flex flex-col">
                    {TYPE_SCALE.map((style) => (
                        <div
                            key={style.name}
                            className="grid gap-4 border-t-[1.5px] border-ink py-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10"
                        >
                            <div className="flex flex-col gap-1">
                                <p className="text-[1.25rem] font-extrabold">{style.name}</p>
                                <p className="font-mono text-code text-ink-soft">{style.spec}</p>
                                <p className="font-mono text-code text-tan uppercase">Mobile {style.mobile}</p>
                            </div>
                            <p className={`min-w-0 break-words ${style.className}`}>{style.sample()}</p>
                        </div>
                    ))}
                </div>
            </BoardSection>

            <BoardSection title="Colors">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
                    {SWATCHES.map((swatch) => (
                        <div key={swatch.token} className="flex flex-col gap-2">
                            <div
                                className={`h-20 border-[1.5px] ${swatch.dark ? 'border-ink' : 'border-transparent'} ${swatch.className}`}
                            />
                            <p className="font-mono text-label uppercase">{swatch.token}</p>
                            <p className="font-mono text-code text-ink-soft">{swatch.hex}</p>
                            <p className="text-body-sm text-ink-soft">{swatch.use}</p>
                        </div>
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-grain flex h-32 items-end border-[1.5px] border-ink p-4 font-mono text-label uppercase">
                        bg-grain
                    </div>
                    <div className="bg-grain-dark flex h-32 items-end p-4 font-mono text-label text-paper uppercase">bg-grain-dark</div>
                </div>
            </BoardSection>

            <BoardSection title="Buttons & tags">
                <div className="flex flex-wrap items-start gap-10">
                    <Specimen label="Button / Primary">
                        <ButtonLink variant="primary" to="/contact">
                            {m.cta_button()}
                        </ButtonLink>
                    </Specimen>
                    <Specimen label="Button / Dark">
                        <Button variant="dark">{m.cta_button()}</Button>
                    </Specimen>
                    <Specimen label="Button / Dark sm (header)">
                        <Button variant="dark" size="sm">
                            {m.cta_button()}
                        </Button>
                    </Specimen>
                    <Specimen label="Chip / Social">
                        <div className="flex gap-2">
                            {socialLinks.map((link) => (
                                <SocialChip key={link.label} href={link.href} label={link.label} icon={link.icon} />
                            ))}
                        </div>
                    </Specimen>
                    <Specimen label="Code Tag">
                        <CodeTag className="lg:w-28">WEB.APP</CodeTag>
                    </Specimen>
                </div>
            </BoardSection>

            <BoardSection title="Decor & labels">
                <div className="flex flex-wrap items-end gap-12">
                    <Specimen label="Eyebrow · tan / teal">
                        <div className="flex flex-col gap-4">
                            <Eyebrow>[02] {m.services_label()}</Eyebrow>
                            <Eyebrow tone="teal">[01] {m.about_story_label()}</Eyebrow>
                        </div>
                    </Specimen>
                    <Specimen label="Glyph Name">
                        <GlyphName />
                    </Specimen>
                    <Specimen label="Barcode">
                        <Barcode />
                    </Specimen>
                    <Specimen label="Sparkles · tilted / level">
                        <div className="flex items-end gap-6">
                            <Sparkles />
                            <Sparkles variant="level" className="text-teal" />
                        </div>
                    </Specimen>
                    <Specimen label="Star Ornament">
                        <StarOrnament />
                    </Specimen>
                </div>
            </BoardSection>

            <BoardSection title="Navigation">
                <p className="text-body text-ink-soft">
                    Nav / Desktop (≥ 1024 px) and Nav / Mobile (menu dialog) are the live site header at the top of this page.
                </p>
            </BoardSection>

            <BoardSection title="Service rows">
                <div className="border-b-[1.5px] border-ink">
                    <ServiceRow index="01" title={m.service_webapp_title()} description={m.service_webapp_desc()} code="WEB.APP" />
                    <ServiceRow
                        index="02"
                        title={m.service_backend_title()}
                        description={m.service_backend_desc()}
                        code="API.SYS"
                        glyphs={GLYPH_WORDS.eyebrow}
                    />
                </div>
            </BoardSection>

            <BoardSection title="Content blocks">
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
                    <Specimen label="Stat">
                        <Stat bordered code="S.01" value="6" label={m.about_stat_years()} />
                    </Specimen>
                    <Specimen label="Standard Item">
                        <StandardItem code="S.01" title={m.cta_proof_1_title()} description={m.cta_proof_1_desc()} />
                    </Specimen>
                    <Specimen label="Tech Cell">
                        <TechCell bordered index="T.01" name="React" />
                    </Specimen>
                    <Specimen label="Contact Detail Rows" className="md:col-span-2 xl:col-span-4">
                        <div className="border-b-[1.5px] border-ink">
                            <ContactDetailRow
                                icon={Mail}
                                label={m.contact_label_email()}
                                value="hello@example.com"
                                href="mailto:hello@example.com"
                            />
                            <ContactDetailRow icon={MapPin} label={m.contact_label_location()} value={m.contact_location_value()} />
                            <ContactDetailRow
                                icon={Phone}
                                label={m.contact_label_phone()}
                                value={SITE.phone.display}
                                href={SITE.phone.href}
                            />
                        </div>
                    </Specimen>
                </div>
            </BoardSection>

            <BoardSection title="Name plate">
                <NamePlate meta={[m.nameplate_company_id(), m.nameplate_disciplines()]} className="max-w-[940px]" />
            </BoardSection>

            <BoardSection title="Dark components" dark>
                <Eyebrow tone="on-dark">[02.2] {m.process_label()}</Eyebrow>
                <div className="grid gap-10 lg:grid-cols-3">
                    <DarkSpecimen label="Case Card">
                        <CaseCard
                            code="CASE.01"
                            title={m.work_example_webapp_title()}
                            description={m.work_example_webapp_desc()}
                            output={m.work_example_webapp_result()}
                            bars={BARCODE_PATTERNS.case1}
                        />
                    </DarkSpecimen>
                    <DarkSpecimen label="Process Step">
                        <ol className="flex flex-col gap-7">
                            <ProcessStep as="li" number="01" title={m.process_step_1_title()} description={m.process_step_1_desc()} />
                            <ProcessStep as="li" number="02" title={m.process_step_2_title()} description={m.process_step_2_desc()} />
                        </ol>
                    </DarkSpecimen>
                    <DarkSpecimen label="Form Field + Button / Submit">
                        <form className="flex flex-col gap-[22px]" action={ignoreSubmit}>
                            <FormField
                                id="sg-name"
                                label={m.contact_form_name()}
                                typeHint="string"
                                placeholder={m.contact_form_name_placeholder()}
                                autoComplete="name"
                            />
                            <FormField
                                id="sg-email"
                                label={m.contact_form_email()}
                                typeHint="string"
                                type="email"
                                defaultValue="jan@"
                                error={m.contact_validation_email_invalid()}
                            />
                            <FormField
                                id="sg-message"
                                multiline
                                label={m.contact_form_message()}
                                typeHint="text"
                                placeholder={m.contact_form_message_placeholder()}
                            />
                            <SubmitButton>{m.contact_form_submit()}</SubmitButton>
                            <SubmitButton isPending pendingLabel={m.contact_form_submitting()}>
                                {m.contact_form_submit()}
                            </SubmitButton>
                        </form>
                    </DarkSpecimen>
                </div>
            </BoardSection>

            <BoardSection title="Footers">
                <p className="text-body text-ink-soft">Footer / Desktop and Footer / Mobile are the live responsive footer below.</p>
            </BoardSection>
        </>
    )
}
