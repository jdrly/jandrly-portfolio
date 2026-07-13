//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
    {
        ignores: ['.agents/**', '.cursor/**', '.output/**', '.vercel/**', 'src/paraglide/**'],
    },
    ...tanstackConfig,
]
