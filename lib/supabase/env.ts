const getEnvValue = (primaryKey: string, fallbackKey: string): string | undefined => {
    const primary = process.env[primaryKey]?.trim();
    if (primary) {
        return primary;
    }

    const fallback = process.env[fallbackKey]?.trim();
    if (fallback) {
        return fallback;
    }

    return undefined;
};

export const getSupabaseEnv = () => {
    const url = getEnvValue('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL');
    const anonKey = getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');

    if (!url || !anonKey) {
        throw new Error(
            'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY).'
        );
    }

    return { url, anonKey };
};
