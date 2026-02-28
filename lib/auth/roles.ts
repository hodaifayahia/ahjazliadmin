type UserLike = {
    app_metadata?: unknown;
    user_metadata?: unknown;
};

export const normalizeRole = (role?: string | null) =>
    typeof role === 'string' ? role.trim().toLowerCase() : '';

export const isAdminRole = (role?: string | null) => {
    const normalized = normalizeRole(role);
    return normalized === 'admin' || normalized === 'super_admin';
};

const readRoleFromMetadata = (metadata: unknown) => {
    if (!metadata || typeof metadata !== 'object') {
        return '';
    }

    const roleValue = (metadata as Record<string, unknown>).role;
    return typeof roleValue === 'string' ? roleValue : '';
};

export const getUserRoleFallback = (user: UserLike | null | undefined) =>
    normalizeRole(readRoleFromMetadata(user?.app_metadata) || readRoleFromMetadata(user?.user_metadata));
