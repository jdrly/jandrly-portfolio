//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
    {
        ignores: ['.cursor/**', '.output/**', 'src/paraglide/**'],
    },
    ...tanstackConfig,
]
