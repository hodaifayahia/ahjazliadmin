'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Emoji } from 'react-apple-emojis';

interface Profile {
    full_name: string | null;
    avatar_url: string | null;
    role: 'user' | 'venue_owner' | 'admin';
    status: 'pending' | 'active' | 'rejected';
}

interface DashboardLayoutProps {
    user: User;
    profile: Profile | null;
    locale: string;
    children: React.ReactNode;
}

// SVG Icons
const HomeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const VenuesIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const UsersIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const InquiriesIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const BellIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

function LanguageSwitcher({ locale }: { locale: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const handleSwitch = (lang: string) => {
        const segments = pathname.split('/');
        segments[1] = lang;
        const newPath = segments.join('/');
        router.push(newPath);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors"
                title="Change Language"
            >
                <Emoji name="globe-showing-europe-africa" width={18} />
                <span className="uppercase text-xs font-medium">{locale}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            className="absolute top-full right-0 mt-1 w-24 bg-white rounded-lg shadow-lg border border-slate-100 overflow-hidden z-20"
                        >
                            {(['en', 'fr', 'ar'] as const).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => handleSwitch(lang)}
                                    className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between ${locale === lang ? 'text-primary-600 font-medium bg-primary-50' : 'text-slate-600'
                                        }`}
                                >
                                    <span className="uppercase">{lang}</span>
                                    {locale === lang && <span>✓</span>}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function DashboardLayout({ user, profile, locale, children }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Admin');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const dir = locale === 'ar' ? 'rtl' : 'ltr';

    const navigation = [
        { name: 'Dashboard', href: `/${locale}/dashboard`, icon: HomeIcon, emoji: 'chart-increasing', labelKey: 'nav.dashboard' },
        { name: 'Venues', href: `/${locale}/dashboard/venues`, icon: VenuesIcon, emoji: 'classical-building', labelKey: 'nav.venues' },
        { name: 'Users', href: `/${locale}/dashboard/users`, icon: UsersIcon, emoji: 'busts-in-silhouette', labelKey: 'nav.users' },
        { name: 'Inquiries', href: `/${locale}/dashboard/inquiries`, icon: InquiriesIcon, emoji: 'speech-balloon', labelKey: 'nav.inquiries' },
        { name: 'Notifications', href: `/${locale}/dashboard/notifications`, icon: BellIcon, emoji: 'bell', labelKey: 'nav.notifications' },
        { name: 'Settings', href: `/${locale}/dashboard/settings`, icon: SettingsIcon, emoji: 'gear', labelKey: 'nav.settings' },
    ];

    const handleSignOut = async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
        } catch {
            router.push(`/${locale}/login`);
            router.refresh();
            return;
        }

        router.push(`/${locale}/login`);
        router.refresh();
    };

    const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" dir={dir}>
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: dir === 'rtl' ? '100%' : '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: dir === 'rtl' ? '100%' : '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`w-72 bg-white flex flex-col fixed inset-y-0 z-40 md:hidden shadow-xl ${dir === 'rtl' ? 'right-0' : 'left-0'}`}
                        >
                            {/* Logo */}
                            <div className="h-16 flex items-center px-4 border-b border-slate-100 justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-200">
                                        <Emoji name="shield" width={20} />
                                    </div>
                                    <span className="text-lg font-bold text-slate-800">{t('title')}</span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Mobile Sidebar Content */}
                            <div className="flex-1 overflow-y-auto">
                                <nav className="px-2 py-4 space-y-1">
                                    {navigation.map((item) => {
                                        const isActive = pathname === item.href || (item.href !== `/${locale}/dashboard` && pathname.startsWith(item.href));
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                    }`}
                                            >
                                                <Emoji name={item.emoji as any} width={18} />
                                                {t(item.labelKey)}
                                            </Link>
                                        );
                                    })}
                                </nav>

                                {/* Mobile User Menu */}
                                <div className="mt-auto border-t border-slate-100 p-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                                            <img
                                                src={profile?.avatar_url || user.user_metadata?.avatar_url}
                                                alt={displayName}
                                                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-600 text-sm font-bold">
                                                {displayName[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                                            <p className="text-xs text-slate-500 truncate">{t('role.admin')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <LanguageSwitcher locale={locale} />
                                        <button
                                            onClick={handleSignOut}
                                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            {t('header.signout')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className={`w-56 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-screen ${dir === 'rtl' ? 'border-l border-r-0 right-0' : 'left-0'}`}>
                {/* Logo */}
                <div className="h-14 flex items-center px-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-200">
                            <Emoji name="shield" width={18} />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-slate-800">{t('title')}</span>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t('subtitle')}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== `/${locale}/dashboard` && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Emoji name={item.emoji as any} width={18} />
                                {t(item.labelKey)}
                            </Link>
                        );
                    })}
                </nav>

                {/* Admin Badge */}
                <div className="p-3 mx-3 mb-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg text-white">
                    <div className="flex items-center gap-2">
                        <Emoji name="shield-check" width={20} />
                        <div>
                            <p className="text-xs font-semibold">{t('role.admin')}</p>
                            <p className="text-[10px] opacity-80">{t('role.full_access')}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${dir === 'rtl' ? 'md:mr-56' : 'md:ml-56'}`}>
                {/* Navbar */}
                <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Mobile Logo */}
                        <div className="md:hidden flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                                <Emoji name="shield" width={18} />
                            </div>
                            <span className="text-lg font-bold text-slate-800">{t('title')}</span>
                        </div>
                    </div>

                    {/* User Menu - Desktop Only */}
                    <div className="hidden md:flex items-center gap-3">
                        <LanguageSwitcher locale={locale} />
                        
                        {/* Admin Badge */}
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                            {t('role.admin')}
                        </span>

                        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                            {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                                <img
                                    src={profile?.avatar_url || user.user_metadata?.avatar_url}
                                    alt={displayName}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                            ) : (
                                <div className="w-7 h-7 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold">
                                    {displayName[0]?.toUpperCase()}
                                </div>
                            )}
                            <span className="text-sm font-medium text-slate-700 max-w-[150px] truncate">
                                {displayName}
                            </span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            {t('header.signout')}
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
