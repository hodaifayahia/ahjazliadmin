import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { arabicFont } from "@/lib/fonts";
import AppProviders from "@/components/AppProviders";
import '../globals.css';

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

    return (
        <html lang={locale} dir={dir}>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Parkinsans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
                <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏛️</text></svg>" />
            </head>
            <body className={`${fontClass} antialiased`}>
                <NextIntlClientProvider messages={messages}>
                    <AppProviders>
                        {children}
                    </AppProviders>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
