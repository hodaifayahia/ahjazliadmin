import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getUserRoleFallback, isAdminRole } from '@/lib/auth/roles';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { getRequestOrigin } from '@/lib/auth/origin';
import { checkRateLimit, getClientIP, recordFailedAttempt, clearBlock } from '@/lib/auth/rate-limit';

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
    const origin = getRequestOrigin(request);
    const code = requestUrl.searchParams.get('code');
    const localeParam = requestUrl.searchParams.get('locale');
    const locale = localeParam && ['en', 'fr', 'ar'].includes(localeParam) ? localeParam : 'fr';
    const redirectToParam = requestUrl.searchParams.get('redirectTo');
    const safeRedirectPath =
        redirectToParam && redirectToParam.startsWith('/') && !redirectToParam.startsWith('//')
            ? redirectToParam
            : '/dashboard';
    const localizedRedirectPath =
        safeRedirectPath.startsWith(`/${locale}/`) || safeRedirectPath === `/${locale}`
            ? safeRedirectPath
            : `/${locale}${safeRedirectPath}`;

    // Check rate limit before processing
    const ip = getClientIP(request);
    const rateCheck = checkRateLimit(ip);
    if (rateCheck.blocked) {
        const blockedUrl = new URL(`/${locale}/access-denied`, origin);
        blockedUrl.searchParams.set('blocked', 'true');
        blockedUrl.searchParams.set('remaining', String(rateCheck.remainingSeconds));
        return NextResponse.redirect(blockedUrl);
    }

    if (code) {
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
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('Auth callback error:', error);
            return redirectWithCookies(response, new URL(`/${locale}/login?error=auth_failed`, origin));
        }

        // Verify the user is an admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return redirectWithCookies(response, new URL(`/${locale}/login?error=no_user`, origin));
        }

        // Check if user has admin role in profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const effectiveRole = profile?.role || getUserRoleFallback(user);

        if (!isAdminRole(effectiveRole)) {
            // Not an admin - sign them out, record failed attempt, and redirect to access denied
            await supabase.auth.signOut();
            recordFailedAttempt(ip);

            const rateInfo = checkRateLimit(ip);
            const blockedUrl = new URL(`/${locale}/access-denied`, origin);
            blockedUrl.searchParams.set('blocked', 'true');
            blockedUrl.searchParams.set('remaining', String(rateInfo.remainingSeconds));
            return redirectWithCookies(response, blockedUrl);
        }

        // Admin verified - clear any blocks and redirect to intended page
        clearBlock(ip);
        return redirectWithCookies(response, new URL(localizedRedirectPath, origin));
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(new URL(`/${locale}/login?error=auth_callback_error`, origin));
}
