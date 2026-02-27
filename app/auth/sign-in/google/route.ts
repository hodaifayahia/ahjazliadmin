import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SUPPORTED_LOCALES = ['en', 'fr', 'ar'];

const normalizeRedirectPath = (value: string | null) => {
    if (!value || !value.startsWith('/') || value.startsWith('//')) {
        return '/dashboard';
    }

    return value;
};

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const localeParam = requestUrl.searchParams.get('locale');
    const locale = localeParam && SUPPORTED_LOCALES.includes(localeParam) ? localeParam : 'en';
    const redirectTo = normalizeRedirectPath(requestUrl.searchParams.get('redirectTo'));

    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    const callbackUrl = new URL('/auth/callback', request.url);
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
        return NextResponse.redirect(new URL(`/${locale}/login?error=auth_start_failed`, request.url));
    }

    return NextResponse.redirect(data.url);
}
