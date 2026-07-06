interface AppConfig {
    BACKEND_API: string;
    POSTHOG_KEY?: string;
    POSTHOG_HOST?: string;
}

function getConfig(): AppConfig {
    const env = (window as any).__ENV__;

    if (!env) {
        throw new Error("Runtime config not loaded");
    }


    return {
        BACKEND_API: env.BACKEND_API,
        POSTHOG_KEY: env.POSTHOG_KEY || "",
        POSTHOG_HOST: env.POSTHOG_HOST || "https://eu.i.posthog.com",
    };
}

export const config = getConfig();