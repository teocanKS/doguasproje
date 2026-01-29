export const useAuth = () => {
    const token = useState<string | null>('auth:token', () => null);
    const user = useState<any>('auth:user', () => null);
    const config = useRuntimeConfig();

    // Load token from localStorage on client side
    if (process.client) {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken && !token.value) {
            token.value = storedToken;
        }
    }

    const login = async (email: string, password: string) => {
        try {
            const response = await $fetch(`${config.public.apiBase}/auth/login`, {
                method: 'POST',
                body: { email, password },
            });

            if (response.success && response.token) {
                token.value = response.token;
                user.value = response.user;

                if (process.client) {
                    localStorage.setItem('auth_token', response.token);
                }

                return { success: true, user: response.user };
            }

            return { success: false, error: response.error || 'Giriş başarısız' };
        } catch (error: any) {
            return {
                success: false,
                error: error.data?.error || 'Bir hata oluştu',
                needsApproval: error.data?.needsApproval,
            };
        }
    };

    const register = async (email: string, password: string, name: string, surname: string) => {
        try {
            const response = await $fetch(`${config.public.apiBase}/auth/register`, {
                method: 'POST',
                body: { email, password, name, surname },
            });

            return { success: true, message: response.message };
        } catch (error: any) {
            return {
                success: false,
                error: error.data?.error || 'Kayıt başarısız',
            };
        }
    };

    const logout = () => {
        token.value = null;
        user.value = null;

        if (process.client) {
            localStorage.removeItem('auth_token');
        }

        navigateTo('/login');
    };

    const fetchCurrentUser = async () => {
        if (!token.value) return null;

        try {
            const response = await $fetch(`${config.public.apiBase}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token.value}`,
                },
            });

            if (response.success) {
                user.value = response.user;
                return response.user;
            }

            return null;
        } catch (error) {
            logout();
            return null;
        }
    };

    const isAdmin = computed(() => user.value?.role === 'yonetici');
    const isAuthenticated = computed(() => !!token.value);

    return {
        token,
        user,
        login,
        register,
        logout,
        fetchCurrentUser,
        isAdmin,
        isAuthenticated,
    };
};
