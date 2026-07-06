import posthog from 'posthog-js'

export const THEME_FLAG_KEY = 'secret-notes-theme'

export type ThemeVariant = 'light' | 'dark'

export function initPostHog(): boolean {
    if (!import.meta.env.VITE_POSTHOG_KEY) {
        console.warn('PostHog is not configured. Theme experiment will use the light theme fallback.')
        return false
    }

    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
        api_host: import.meta.env.VITE_POSTHOG_HOST,
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
    if (!import.meta.env.VITE_POSTHOG_KEY) {
        callback('light')
        return
    }

    posthog.onFeatureFlags(() => {
        callback(getThemeVariant())
    })
}

export function captureThemeVariantApplied(variant: ThemeVariant): void {
    if (!import.meta.env.VITE_POSTHOG_KEY) {
        return
    }

    posthog.capture('theme_variant_applied', {
        variant,
        flag: THEME_FLAG_KEY,
    })
}