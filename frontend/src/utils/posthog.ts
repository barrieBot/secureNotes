import posthog from 'posthog-js'

import { config } from '@/config/config'

export const THEME_FLAG_KEY = 'secret-notes-theme'

export type ThemeVariant = 'light' | 'dark'

export function initPostHog(): boolean {
    if (!config.POSTHOG_KEY) {
        console.warn('PostHog is not configured. Theme experiment will use the light theme fallback.')
        return false
    }

    posthog.init(config.POSTHOG_KEY, {
        api_host: config.POSTHOG_HOST,
        defaults: '2025-05-24',
        capture_pageview: true,
    })

    return true
}

export function getThemeVariant(): ThemeVariant {
    const variant = posthog.getFeatureFlag(THEME_FLAG_KEY)

    if (variant === 'dark') {
        return 'dark'
    }

    return 'light'
}

export function onThemeVariantLoaded(callback: (variant: ThemeVariant) => void): void {
    if (!config.POSTHOG_KEY) {
        callback('light')
        return
    }

    posthog.onFeatureFlags(() => {
        callback(getThemeVariant())
    })
}

export function captureThemeVariantApplied(variant: ThemeVariant): void {
    if (!config.POSTHOG_KEY) {
        return
    }

    posthog.capture('theme_variant_applied', {
        variant,
        flag: THEME_FLAG_KEY,
    })
}