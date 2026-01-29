export const useApi = () => {
    const config = useRuntimeConfig();
    const { token } = useAuth();

    const apiFetch = async (endpoint: string, options: any = {}) => {
        const headers: any = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // If body is FormData, let the browser set the Content-Type (with boundary)
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        if (token.value) {
            headers.Authorization = `Bearer ${token.value}`;
        }

        try {
            const response = await $fetch(`${config.public.apiBase}${endpoint}`, {
                ...options,
                headers,
            });
            return response;
        } catch (error: any) {
            console.error('API Error:', error);
            throw error;
        }
    };

    return {
        apiFetch,
    };
};
