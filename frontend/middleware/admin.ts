export default defineNuxtRouteMiddleware((to, from) => {
    const { isAuthenticated, isAdmin } = useAuth();

    if (!isAuthenticated.value) {
        return navigateTo('/login');
    }

    if (!isAdmin.value) {
        return navigateTo('/');
    }
});
