import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { getRequestOrigin } from '@/lib/auth/origin';
import { checkRateLimit, getClientIP } from '@/lib/auth/rate-limit';

const SUPPORTED_LOCALES = ['en', 'fr', 'ar'];

const normalizeRedirectPath = (value: string | null) => {
    if (!value || !value.startsWith('/') || value.startsWith('//')) {
        return '/dashboard';
    }

    return value;
};

const redirectWithCookies = (
    baseResponse: NextResponse,
    destination: URL
) => {
    const redirectResponse = NextResponse.redirect(destination);

    baseResponse.cookies.getAll().forEach(({ name, value }) => {
        redirectResponse.cookies.set(name, value);
    });

    return redirectResponse;
};

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const localeParam = requestUrl.searchParams.get('locale');
    const locale = localeParam && SUPPORTED_LOCALES.includes(localeParam) ? localeParam : 'fr';
    const redirectTo = normalizeRedirectPath(requestUrl.searchParams.get('redirectTo'));
    const origin = getRequestOrigin(request);

    // Check rate limit before initiating OAuth
    const ip = getClientIP(request);
    const rateCheck = checkRateLimit(ip);
    if (rateCheck.blocked) {
        const blockedUrl = new URL(`/${locale}/access-denied`, origin);
        blockedUrl.searchParams.set('blocked', 'true');
        blockedUrl.searchParams.set('remaining', String(rateCheck.remainingSeconds));
        return NextResponse.redirect(blockedUrl);
    }

    const { url, anonKey } = getSupabaseEnv();

    const response = NextResponse.next();
    const supabase = createServerClient(
        url,
        anonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const callbackUrl = new URL('/auth/callback', origin);
    callbackUrl.searchParams.set('locale', locale);
    callbackUrl.searchParams.set('redirectTo', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: callbackUrl.toString(),
        },
    });

    if (error || !data.url) {
        console.error('OAuth start error:', error);
        return redirectWithCookies(response, new URL(`/${locale}/login?error=auth_start_failed`, origin));
    }

    return redirectWithCookies(response, new URL(data.url));
}
