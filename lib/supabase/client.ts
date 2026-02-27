import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';

type RuntimeSupabaseEnv = {
    url?: string;
    anonKey?: string;
};

export function createClient() {
    let url: string;
    let anonKey: string;

    try {
        const env = getSupabaseEnv();
        url = env.url;
        anonKey = env.anonKey;
    } catch (error) {
        const runtimeEnv = (window as typeof window & { __SUPABASE_ENV__?: RuntimeSupabaseEnv }).__SUPABASE_ENV__;

        if (!runtimeEnv?.url || !runtimeEnv?.anonKey) {
            throw error;
        }

        url = runtimeEnv.url;
        anonKey = runtimeEnv.anonKey;
    }

    return createBrowserClient(
        url,
        anonKey
    );
}
