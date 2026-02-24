const getFirstEnvValue = (...keys: string[]): string | undefined => {
    for (const key of keys) {
        const value = process.env[key]?.trim();
        if (value) {
            return value;
        }
    }

    return undefined;
};

export const getSupabaseEnv = () => {
    const url = getFirstEnvValue(
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_DATABASE_URL',
        'SUPABASE_DATABASE_URL'
    );
    const anonKey = getFirstEnvValue(
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_ANON_KEY',
        'SUPABASE_PUBLISHABLE_KEY'
    );

    if (!url || !anonKey) {
        throw new Error(
            'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_DATABASE_URL) and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).'
        );
    }

    return { url, anonKey };
};
