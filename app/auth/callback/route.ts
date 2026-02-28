import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserRoleFallback, isAdminRole } from '@/lib/auth/roles';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const localeParam = requestUrl.searchParams.get('locale');
    const locale = localeParam && ['en', 'fr', 'ar'].includes(localeParam) ? localeParam : 'en';
    const redirectToParam = requestUrl.searchParams.get('redirectTo');
    const safeRedirectPath =
        redirectToParam && redirectToParam.startsWith('/') && !redirectToParam.startsWith('//')
            ? redirectToParam
            : '/dashboard';
    const localizedRedirectPath =
        safeRedirectPath.startsWith(`/${locale}/`) || safeRedirectPath === `/${locale}`
            ? safeRedirectPath
            : `/${locale}${safeRedirectPath}`;

    if (code) {
        const cookieStore = await cookies();
        const supabase = await createClient(cookieStore);
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
            console.error('Auth callback error:', error);
            return NextResponse.redirect(new URL(`/${locale}/login?error=auth_failed`, request.url));
        }

        // Verify the user is an admin
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.redirect(new URL(`/${locale}/login?error=no_user`, request.url));
        }

        // Check if user has admin role in profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const effectiveRole = profile?.role || getUserRoleFallback(user);

        if (!isAdminRole(effectiveRole)) {
            // Not an admin - sign them out and redirect to access denied
            await supabase.auth.signOut();
            return NextResponse.redirect(new URL(`/${locale}/access-denied`, request.url));
        }

        // Admin verified - redirect to intended page
        return NextResponse.redirect(new URL(localizedRedirectPath, request.url));
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(new URL(`/${locale}/login?error=auth_callback_error`, request.url));
}
