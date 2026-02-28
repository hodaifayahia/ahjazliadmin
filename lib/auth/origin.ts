import type { NextRequest } from 'next/server';

const normalizeUrlOrigin = (value: string) => {
    try {
        return new URL(value).origin;
    } catch {
        return '';
    }
};

export const getRequestOrigin = (request: NextRequest) => {
    const explicitSiteUrl = normalizeUrlOrigin(process.env.NEXT_PUBLIC_SITE_URL || '');
    if (explicitSiteUrl) {
        return explicitSiteUrl;
    }

    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    if (forwardedHost) {
        return `${forwardedProto}://${forwardedHost}`;
    }

    return new URL(request.url).origin;
};
