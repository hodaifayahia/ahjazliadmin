const normalizeEnvValue = (value?: string) => {
    if (!value) {
        return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }

    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1).trim() || undefined;
    }

    return trimmed;
};

const firstDefined = (...values: Array<string | undefined>) => {
    for (const value of values) {
        const normalized = normalizeEnvValue(value);
        if (normalized) {
            return normalized;
        }
    }

    return undefined;
};

const isValidHttpUrl = (value: string) => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

export const getSupabaseEnv = () => {
    const url = firstDefined(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_URL
    );
    const anonKey = firstDefined(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        process.env.SUPABASE_PUBLISHABLE_KEY,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        process.env.SUPABASE_ANON_KEY,
        process.env.NEXT_PUBLIC_SUPABASE_KEY,
        process.env.SUPABASE_KEY
    );

    if (!url) {
        throw new Error(
            'Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL).'
        );
    }

    if (!isValidHttpUrl(url)) {
        throw new Error(
            'Invalid Supabase URL. Expected format: https://<your-supabase-host>'
        );
    }

    if (!anonKey) {
        throw new Error(
            'Missing Supabase public API key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        );
    }

    return { url, anonKey };
};
