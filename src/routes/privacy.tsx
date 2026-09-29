import { createFileRoute } from '@tanstack/react-router'
import { PrivacyPage } from '@/components/pages/PrivacyPage'
import { createPageHead } from '@/lib/pageHead'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/privacy')({
    head: () => createPageHead('/privacy', m.meta_privacy_title(), m.meta_privacy_description()),
    component: PrivacyPage,
})
