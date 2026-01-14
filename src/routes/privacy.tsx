import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacy')({
    component: PrivacyPage,
})

function PrivacyPage() {
    return (
        <main>
            <section
                aria-labelledby="privacy-heading"
                className="relative min-h-screen flex flex-col items-center px-6 pt-32 pb-20"
            >
                {/* Background with radial gradient */}
                <div className="absolute inset-0 z-0 bg-bg" aria-hidden="true">
                    <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,80,0.03),transparent_50%)]" />
                </div>

                <article className="z-10 mx-auto w-full max-w-3xl">
                    {/* Header */}
                    <header className="mb-16 text-center">
                        <div className="mb-6 flex items-center justify-center gap-3">
                            <span
                                className="h-px w-12 bg-border"
                                aria-hidden="true"
                            />
                            <span className="text-sm font-medium uppercase tracking-widest text-accent">
                                Legal
                            </span>
                            <span
                                className="h-px w-12 bg-border"
                                aria-hidden="true"
                            />
                        </div>
                        <h1
                            id="privacy-heading"
                            className="mb-6 text-4xl font-bold tracking-tight md:text-6xl"
                        >
                            Privacy Policy
                        </h1>
                        <p className="text-sm uppercase tracking-wider text-text-muted">
                            Last Updated: January 2024
                        </p>
                    </header>

                    {/* Content */}
                    <div className="text-lg text-[#aaaaaa]">
                        <p className="mb-8 text-xl text-white">
                            Your privacy is important. This policy outlines how
                            personal information is collected, used, and
                            protected when you visit this website.
                        </p>

                        <h2 className="mb-4 mt-12 text-xl font-semibold text-white">
                            1. Information Collection
                        </h2>
                        <p className="mb-6">
                            We collect minimal information necessary to provide
                            you with the best experience. This may include:
                        </p>
                        <ul className="mb-8 list-disc space-y-2 pl-6 marker:text-accent">
                            <li>
                                Contact information you voluntarily provide
                                (name, email) via forms.
                            </li>
                            <li>
                                Anonymous usage data to help us improve website
                                performance.
                            </li>
                            <li>
                                Device and browser information for optimization
                                purposes.
                            </li>
                        </ul>

                        <h2 className="mb-4 mt-12 text-xl font-semibold text-white">
                            2. Usage of Information
                        </h2>
                        <p className="mb-6">
                            Any information collected is used solely for the
                            purpose of communicating with you regarding
                            projects, inquiries, or services. We do not sell,
                            trade, or otherwise transfer your personally
                            identifiable information to outside parties.
                        </p>

                        <h2 className="mb-4 mt-12 text-xl font-semibold text-white">
                            3. Data Protection
                        </h2>
                        <p className="mb-6">
                            We implement a variety of security measures to
                            maintain the safety of your personal information.
                            However, no method of transmission over the Internet
                            is 100% secure, and we cannot guarantee absolute
                            security.
                        </p>

                        <h2 className="mb-4 mt-12 text-xl font-semibold text-white">
                            4. Third-Party Links
                        </h2>
                        <p className="mb-6">
                            This website may contain links to third-party sites.
                            These third-party sites have separate and
                            independent privacy policies. We therefore have no
                            responsibility or liability for the content and
                            activities of these linked sites.
                        </p>

                        <h2 className="mb-4 mt-12 text-xl font-semibold text-white">
                            5. Contact
                        </h2>
                        <p className="mb-6">
                            If you have any questions regarding this privacy
                            policy, you may contact us using the information on
                            our Contact page.
                        </p>
                    </div>
                </article>
            </section>
        </main>
    )
}
