import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import { getUserRoleFallback, isAdminRole } from '@/lib/auth/roles';

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/login`);
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const effectiveRole = profile?.role || getUserRoleFallback(user);

    // Check if user is admin - redirect to access denied if not
    if (!isAdminRole(effectiveRole)) {
        redirect(`/${locale}/access-denied`);
    }

    return (
        <DashboardLayout user={user} profile={profile} locale={locale}>
            {children}
        </DashboardLayout>
    );
}
