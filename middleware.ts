import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from './lib/supabase/env';

const locales = ['en', 'fr', 'ar'];

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale: 'fr',
    localePrefix: 'always'
});

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Extract locale from pathname
    const pathLocale = pathname.split('/')[1];
    const isValidLocale = locales.includes(pathLocale);
    const effectiveLocale = isValidLocale ? pathLocale : 'fr';
    const pathWithoutLocale = isValidLocale ? pathname.slice(pathLocale.length + 1) : pathname;

    // Public routes that don't need auth
    const publicRoutes = ['/login', '/access-denied'];
    const isPublicRoute =
        publicRoutes.some(route => pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/')) ||
        pathWithoutLocale === '' ||
        pathWithoutLocale === '/';

    // Skip auth for public routes — just run i18n
    if (isPublicRoute) {
        return intlMiddleware(request);
    }

    // For protected routes, check auth using getSession (fast, no network call to Supabase Auth server)
    const response = intlMiddleware(request);

    try {
        const { url, anonKey } = getSupabaseEnv();
        const supabase = createServerClient(url, anonKey, {
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
        });

        // Use getSession() instead of getUser() — it reads from the cookie locally
        // which is instant instead of making a network call to Supabase Auth server.
        // Security note: session is verified server-side on actual data fetches.
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            const loginUrl = new URL(`/${effectiveLocale}/login`, request.url);
            loginUrl.searchParams.set('redirectTo', pathWithoutLocale || '/dashboard');
            return NextResponse.redirect(loginUrl);
        }

        // If logged in and hitting login page, redirect to dashboard
        if (pathWithoutLocale === '/login') {
            return NextResponse.redirect(new URL(`/${effectiveLocale}/dashboard`, request.url));
        }

    } catch (error) {
        console.error('Middleware auth check failed:', error);
        const loginUrl = new URL(`/${effectiveLocale}/login`, request.url);
        loginUrl.searchParams.set('redirectTo', pathWithoutLocale || '/dashboard');
        return NextResponse.redirect(loginUrl);
    }

    return response;
}

export const config = {
    matcher: ['/((?!api|auth|_next|_vercel|.*\\..*).*)', '/']
};
