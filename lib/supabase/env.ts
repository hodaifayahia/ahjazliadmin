const FALLBACK_SUPABASE_URL = 'https://fqtmfydwbzkhwwmaaiba.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_hgiDpWndu4ZDQe8731LDWA_605G1H0r';

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
    const url =
        getFirstEnvValue('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL') ?? FALLBACK_SUPABASE_URL;
    const anonKey = getFirstEnvValue(
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_ANON_KEY',
        'SUPABASE_PUBLISHABLE_KEY'
    ) ?? FALLBACK_SUPABASE_PUBLISHABLE_KEY;

    return { url, anonKey };
};
