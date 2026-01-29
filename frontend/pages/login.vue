<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 px-4 relative overflow-hidden">
    <!-- Animated Background Shapes -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
      <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-float" style="animation-delay: 2s;"></div>
    </div>

    <div class="w-full max-w-md relative z-10 animate-fade-in">
      <div class="glass-card p-8 sm:p-10">
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 mb-6 animate-float">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Doğu AŞ</h1>
          <p class="text-slate-500 mt-2 text-sm font-medium">Stok ve Süreç Takip Sistemi</p>
        </div>

        <div v-if="successMessage" class="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm flex items-center gap-3 animate-slide-up">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-3 animate-slide-up">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="space-y-2">
            <label class="label">E-posta Adresi</label>
            <div class="relative">
              <input
                v-model="email"
                type="email"
                required
                class="input pl-11"
                placeholder="ornek@doguas.com"
              />
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="label">Şifre</label>
            <div class="relative">
              <input
                v-model="password"
                type="password"
                required
                class="input pl-11"
                placeholder="••••••••"
              />
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full btn btn-primary py-3.5 text-base shadow-glow hover:shadow-glow-hover transition-all duration-300"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Giriş Yapılıyor...' : 'Giriş Yap' }}
          </button>
        </form>

        <div class="mt-8 text-center">
          <p class="text-sm text-slate-500">
            Hesabınız yok mu?
            <NuxtLink to="/register" class="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-all">
              Kayıt Olun
            </NuxtLink>
          </p>
        </div>
      </div>
      
      <div class="mt-8 text-center">
        <p class="text-xs text-slate-500/60 font-medium">© 2025 Doğu AŞ. Tüm hakları saklıdır.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false,
});

const { login } = useAuth();
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';
  
  const result = await login(email.value, password.value);
  
  if (result.success) {
    navigateTo('/');
  } else {
    if (result.needsApproval) {
      errorMessage.value = 'Hesabınız henüz onaylanmamış. Lütfen yönetici onayını bekleyin.';
    } else {
      errorMessage.value = result.error || 'Giriş başarısız oldu.';
    }
  }
  
  loading.value = false;
};
</script>
