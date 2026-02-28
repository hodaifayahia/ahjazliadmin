'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserRoleFallback, isAdminRole } from '@/lib/auth/roles';

// Multi-language notification templates
const notificationTemplates = {
    venue: {
        pending: {
            en: { title: 'Venue Under Review', message: 'Your venue \"{name}\" is under review. We will notify you once a decision is made.' },
            fr: { title: 'Salle en Cours d\'Examen', message: 'Votre salle \"{name}\" est en cours d\'examen. Nous vous informerons des qu\'une decision sera prise.' },
            ar: { title: 'Venue Under Review', message: 'Your venue \"{name}\" is under review. We will notify you once a decision is made.' }
        },
        approved: {
            en: { title: 'Venue Approved', message: 'Your venue "{name}" has been approved and is now published!' },
            fr: { title: 'Salle Approuvée', message: 'Votre salle "{name}" a été approuvée et est maintenant publiée !' },
            ar: { title: 'تمت الموافقة على القاعة', message: 'تمت الموافقة على قاعتك "{name}" وتم نشرها الآن!' }
        },
        rejected: {
            en: { title: 'Venue Rejected', message: 'Your venue "{name}" was rejected. Reason: {reason}' },
            fr: { title: 'Salle Rejetée', message: 'Votre salle "{name}" a été rejetée. Raison: {reason}' },
            ar: { title: 'تم رفض القاعة', message: 'تم رفض قاعتك "{name}". السبب: {reason}' }
        }
    },
    account: {
        pending: {
            en: { title: 'Account Under Review', message: 'Your account is under review. We will notify you once a decision is made.' },
            fr: { title: 'Compte en Cours d\'Examen', message: 'Votre compte est en cours d\'examen. Nous vous informerons des qu\'une decision sera prise.' },
            ar: { title: 'Account Under Review', message: 'Your account is under review. We will notify you once a decision is made.' }
        },
        approved: {
            en: { title: 'Account Approved', message: 'Your account has been approved! You can now list your venues and access all features.' },
            fr: { title: 'Compte Approuvé', message: 'Votre compte a été approuvé ! Vous pouvez maintenant publier vos salles et accéder à toutes les fonctionnalités.' },
            ar: { title: 'تمت الموافقة على الحساب', message: 'تمت الموافقة على حسابك! يمكنك الآن إدراج قاعاتك والوصول إلى جميع الميزات.' }
        },
        rejected: {
            en: { title: 'Account Rejected', message: 'Your account has been rejected. Please contact support for more information.' },
            fr: { title: 'Compte Rejeté', message: 'Votre compte a été rejeté. Veuillez contacter le support pour plus d\'informations.' },
            ar: { title: 'تم رفض الحساب', message: 'تم رفض حسابك. يرجى التواصل مع الدعم للحصول على مزيد من المعلومات.' }
        },
        pending_reminder: {
            en: { title: 'Complete Your Profile', message: 'Your account is pending. Please complete your profile information in settings to get approved faster.' },
            fr: { title: 'Complétez Votre Profil', message: 'Votre compte est en attente. Veuillez compléter les informations de votre profil dans les paramètres pour être approuvé plus rapidement.' },
            ar: { title: 'أكمل ملفك الشخصي', message: 'حسابك قيد الانتظار. يرجى إكمال معلومات ملفك الشخصي في الإعدادات للحصول على الموافقة بشكل أسرع.' }
        }
    }
};

/**
 * Get user's preferred language from profile
 */
async function getUserLanguage(supabase: any, userId: string): Promise<'en' | 'fr' | 'ar'> {
    const { data: profile } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', userId)
        .single();
    
    const lang = profile?.language;
    if (lang === 'fr' || lang === 'ar') return lang;
    return 'en';
}

/**
 * Send notification to a specific user (with auto-translation)
 */
export async function sendNotification(
    recipientId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    senderId?: string
) {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!isAdminRole(adminProfile?.role || getUserRoleFallback(user))) throw new Error('Forbidden');

    const { error } = await supabase.from('notifications').insert({
        recipient_id: recipientId,
        sender_id: senderId || user.id,
        title,
        message,
        type
    });

    if (error) return { success: false, error: error.message };

    return { success: true, count: 1 };
}

/**
 * Send bulk notifications to users
 */
export async function sendBulkNotifications(
    recipientFilter: 'all' | 'active' | 'pending',
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!isAdminRole(adminProfile?.role || getUserRoleFallback(user))) throw new Error('Forbidden');

    // Build query based on filter
    let query = supabase.from('profiles').select('id');
    
    if (recipientFilter === 'active') {
        query = query.eq('status', 'active');
    } else if (recipientFilter === 'pending') {
        query = query.eq('status', 'pending');
    }

    const { data: profiles, error: fetchError } = await query;

    if (fetchError) throw fetchError;
    if (!profiles || profiles.length === 0) {
        return { success: true, count: 0 };
    }

    // Create notifications for all users
    const notifications = profiles.map((profile: any) => ({
        recipient_id: profile.id,
        sender_id: user.id,
        title,
        message,
        type
    }));

    const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

    if (insertError) throw insertError;

    return { success: true, count: notifications.length };
}

/**
 * Update venue status (approve/reject) with multi-language notification
 */
export async function updateVenueStatus(
    venueId: string,
    status: 'pending' | 'approved' | 'published' | 'rejected',
    rejectionReason?: string
) {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    // Verify admin role first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!isAdminRole(profile?.role || getUserRoleFallback(user))) throw new Error('Forbidden');

    const updateData: any = { status };
    if (rejectionReason) updateData.rejection_reason = rejectionReason;

    const { error: updateError } = await supabase
        .from('venues')
        .update(updateData)
        .eq('id', venueId);

    if (updateError) throw updateError;

    // Send multi-language notification to owner
    const { data: venue } = await supabase
        .from('venues')
        .select('owner_id, title, name')
        .eq('id', venueId)
        .single();

    if (venue && status !== 'approved') {
        const venueName = venue.title || venue.name;
        const ownerLang = await getUserLanguage(supabase, venue.owner_id);
        
        const template = status === 'published' 
            ? notificationTemplates.venue.approved[ownerLang]
            : status === 'pending'
                ? notificationTemplates.venue.pending[ownerLang]
                : notificationTemplates.venue.rejected[ownerLang];
        
        const message = status === 'published'
            ? template.message.replace('{name}', venueName)
            : status === 'pending'
                ? template.message.replace('{name}', venueName)
                : template.message.replace('{name}', venueName).replace('{reason}', rejectionReason || 'No reason provided');

        await supabase.from('notifications').insert({
            recipient_id: venue.owner_id,
            title: template.title,
            message,
            type: status === 'published' ? 'success' : status === 'pending' ? 'info' : 'error'
        });
    }

    revalidatePath('/dashboard/venues');
    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Update user status (approve/reject) with multi-language notification
 */
export async function updateUserStatus(userId: string, status: 'pending' | 'active' | 'rejected') {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!isAdminRole(adminProfile?.role || getUserRoleFallback(user))) throw new Error('Forbidden');

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

    if (updateError) throw updateError;

    // Send multi-language notification
    const userLang = await getUserLanguage(supabase, userId);
    const template = status === 'active'
        ? notificationTemplates.account.approved[userLang]
        : status === 'pending'
            ? notificationTemplates.account.pending[userLang]
            : notificationTemplates.account.rejected[userLang];

    await supabase.from('notifications').insert({
        recipient_id: userId,
        title: template.title,
        message: template.message,
        type: status === 'active' ? 'success' : status === 'pending' ? 'info' : 'error'
    });

    revalidatePath('/dashboard/users');
    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Send pending account reminder to users with incomplete profiles
 */
export async function sendPendingReminders() {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!isAdminRole(adminProfile?.role || getUserRoleFallback(user))) throw new Error('Forbidden');

    // Get pending users
    const { data: pendingUsers, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('status', 'pending');

    if (error) throw error;
    if (!pendingUsers || pendingUsers.length === 0) {
        return { success: true, count: 0 };
    }

    // Send personalized reminder to each user in their language
    for (const pendingUser of pendingUsers) {
        const userLang = await getUserLanguage(supabase, pendingUser.id);
        const template = notificationTemplates.account.pending_reminder[userLang];

        await supabase.from('notifications').insert({
            recipient_id: pendingUser.id,
            title: template.title,
            message: template.message,
            type: 'warning'
        });
    }

    return { success: true, count: pendingUsers.length };
}
