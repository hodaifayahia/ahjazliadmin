import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { arabicFont } from "@/lib/fonts";
import AppProviders from "@/components/AppProviders";

export const metadata: Metadata = {
    title: "Admin Panel - Ahjazli Qaati",
    description: "Administration panel for Ahjazli Qaati venue marketplace",
};

const locales = ["en", "fr", "ar"];

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
    children,
    params
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;

    if (!locales.includes(locale)) {
        notFound();
    }

    const messages = await getMessages();
    const dir = locale === "ar" ? "rtl" : "ltr";
    const fontClass = locale === "ar" ? arabicFont.className : "font-parkinsans";
    const runtimeSupabaseEnv = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
        anonKey:
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
            process.env.SUPABASE_PUBLISHABLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            process.env.SUPABASE_ANON_KEY ||
            '',
    };

    return (
        <NextIntlClientProvider messages={messages}>
            <AppProviders>
                <div className={`${fontClass} antialiased`} dir={dir} lang={locale}>
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `window.__SUPABASE_ENV__ = ${JSON.stringify(runtimeSupabaseEnv)};`,
                        }}
                    />
                    {children}
                </div>
            </AppProviders>
        </NextIntlClientProvider>
    );
}
