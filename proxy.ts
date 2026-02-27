import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from './lib/supabase/env';

const intlMiddleware = createMiddleware({
    locales: ['en', 'fr', 'ar'],
    defaultLocale: 'en',
    localePrefix: 'always'
});

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Handle i18n first
    const response = intlMiddleware(request);

    // Extract locale from pathname
    const locale = pathname.split('/')[1];
    const isValidLocale = ['en', 'fr', 'ar'].includes(locale);
    const effectiveLocale = isValidLocale ? locale : 'en';
    const pathWithoutLocale = isValidLocale ? pathname.slice(locale.length + 1) : pathname;

    // Public routes
    const publicRoutes = ['/login', '/auth/callback', '/auth'];
    const isPublicRoute =
        publicRoutes.some(route => pathWithoutLocale.startsWith(route)) ||
        pathWithoutLocale === '' ||
        pathWithoutLocale === '/';

    let user: { id: string } | null = null;
    let supabase: ReturnType<typeof createServerClient> | null = null;

    try {
        const { url, anonKey } = getSupabaseEnv();

        supabase = createServerClient(
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

        const { data } = await supabase.auth.getUser();
        user = data.user;
    } catch (error) {
        console.error('Supabase middleware initialization failed:', error);
        if (!isPublicRoute) {
            const loginUrl = new URL(`/${effectiveLocale}/login`, request.url);
            loginUrl.searchParams.set('redirectTo', pathWithoutLocale || '/dashboard');
            return NextResponse.redirect(loginUrl);
        }

        return response;
    }

    // If not logged in and trying to access protected route
    if (!user && !isPublicRoute) {
        const loginUrl = new URL(`/${effectiveLocale}/login`, request.url);
        loginUrl.searchParams.set('redirectTo', pathWithoutLocale || '/dashboard');
        return NextResponse.redirect(loginUrl);
    }

    // If logged in, check if admin
    if (user && supabase && !isPublicRoute && pathWithoutLocale.startsWith('/dashboard')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        // If not admin, show access denied (you can redirect to main app if you want)
        if (!profile || profile.role !== 'admin') {
            const deniedUrl = new URL(`/${effectiveLocale}/access-denied`, request.url);
            return NextResponse.redirect(deniedUrl);
        }
    }

    // If logged in and trying to access login page
    if (user && pathWithoutLocale === '/login') {
        const dashboardUrl = new URL(`/${effectiveLocale}/dashboard`, request.url);
        return NextResponse.redirect(dashboardUrl);
    }

    return response;
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|auth|.*\\..*).*)']
};

export default proxy;
