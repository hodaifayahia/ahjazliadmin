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

const isPlaceholderSupabaseUrl = (value: string) => {
    try {
        const parsed = new URL(value);
        return parsed.hostname === 'example.supabase.co';
    } catch {
        return false;
    }
};

const decodeJwtPayload = (token: string) => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const payload = parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const paddedPayload = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');

        if (typeof atob !== 'function') {
            return null;
        }

        const decoded = atob(paddedPayload);

        return JSON.parse(decoded) as { role?: string };
    } catch {
        return null;
    }
};

const isServiceRoleKey = (value: string) => {
    if (!value) {
        return false;
    }

    if (value.startsWith('sb_secret_')) {
        return true;
    }

    const payload = decodeJwtPayload(value);
    return payload?.role === 'service_role';
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

    if (isPlaceholderSupabaseUrl(url)) {
        throw new Error(
            'Invalid Supabase URL: example.supabase.co is a placeholder. Set NEXT_PUBLIC_SUPABASE_URL to your real Supabase project URL in Railway variables.'
        );
    }

    if (!anonKey) {
        throw new Error(
            'Missing Supabase public API key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        );
    }

    if (isServiceRoleKey(anonKey)) {
        throw new Error(
            'Unsafe Supabase key detected. Do not use service_role or sb_secret keys in this app. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) to a public key.'
        );
    }

    return { url, anonKey };
};
