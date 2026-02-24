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

export const getSupabaseEnv = () => {
    const url = firstDefined(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL,
        process.env.SUPABASE_URL,
        process.env.SUPABASE_DATABASE_URL
    );
    const anonKey = firstDefined(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        process.env.SUPABASE_ANON_KEY,
        process.env.SUPABASE_PUBLISHABLE_KEY
    );

    if (!url || !anonKey) {
        throw new Error(
            'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_DATABASE_URL) and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).'
        );
    }

    return { url, anonKey };
};
