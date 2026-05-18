interface AppConfig {
    BACKEND_API: string;
}

function getConfig(): AppConfig {
    const env = (window as any).__ENV__;

    if (!env) {
        throw new Error("Runtime config not loaded");
    }


    return env
}

export const config = getConfig();