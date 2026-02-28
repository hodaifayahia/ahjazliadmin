type UserWithRoleMetadata = {
    app_metadata?: { role?: string | null };
    user_metadata?: { role?: string | null };
};

export const normalizeRole = (role?: string | null) =>
    typeof role === 'string' ? role.trim().toLowerCase() : '';

export const isAdminRole = (role?: string | null) => {
    const normalized = normalizeRole(role);
    return normalized === 'admin' || normalized === 'super_admin';
};

export const getUserRoleFallback = (user: UserWithRoleMetadata | null | undefined) =>
    normalizeRole(user?.app_metadata?.role || user?.user_metadata?.role);
