<template>
  <div class="min-h-screen bg-slate-50 flex">
    <!-- Mobile Sidebar Overlay -->
    <div 
      v-if="isMobileMenuOpen" 
      @click="isMobileMenuOpen = false"
      class="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
    ></div>

    <!-- Professional Sidebar -->
    <aside 
      class="w-72 bg-slate-900 text-white min-h-screen fixed left-0 top-0 shadow-2xl z-30 flex flex-col transition-transform duration-300 ease-in-out"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <!-- Logo Area -->
      <div class="p-6 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight text-white">Doğu AŞ</h1>
            <p class="text-slate-400 text-xs font-medium">Stok ve Süreç Takip</p>
          </div>
        </div>
        <!-- Close Button (Mobile Only) -->
        <button @click="isMobileMenuOpen = false" class="lg:hidden text-slate-400 hover:text-white">
          <X :size="24" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        <div class="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menü</div>
        
        <NuxtLink
          to="/"
          class="nav-item group"
          :class="{ 'active': $route.path === '/' }"
        >
          <LayoutDashboard :size="20" class="transition-colors group-hover:text-white" :class="$route.path === '/' ? 'text-white' : 'text-slate-400'" />
          <span class="font-medium">Anasayfa</span>
          <div v-if="$route.path === '/'" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow"></div>
        </NuxtLink>

        <NuxtLink
          to="/stok"
          class="nav-item group"
          :class="{ 'active': $route.path === '/stok' }"
        >
          <Package :size="20" class="transition-colors group-hover:text-white" :class="$route.path === '/stok' ? 'text-white' : 'text-slate-400'" />
          <span class="font-medium">Stok Durumu</span>
          <div v-if="$route.path === '/stok'" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow"></div>
        </NuxtLink>

        <NuxtLink
          to="/analiz"
          class="nav-item group"
          :class="{ 'active': $route.path === '/analiz' }"
        >
          <PieChart :size="20" class="transition-colors group-hover:text-white" :class="$route.path === '/analiz' ? 'text-white' : 'text-slate-400'" />
          <span class="font-medium">Analiz</span>
          <div v-if="$route.path === '/analiz'" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow"></div>
        </NuxtLink>

        <NuxtLink
          to="/aktif-isler"
          class="nav-item group"
          :class="{ 'active': $route.path === '/aktif-isler' }"
        >
          <RefreshCw :size="20" class="transition-colors group-hover:text-white" :class="$route.path === '/aktif-isler' ? 'text-white' : 'text-slate-400'" />
          <span class="font-medium">Siparişler</span>
          <div v-if="$route.path === '/aktif-isler'" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow"></div>
        </NuxtLink>

        <NuxtLink
          to="/gecmis"
          class="nav-item group"
          :class="{ 'active': $route.path === '/gecmis' }"
        >
          <History :size="20" class="transition-colors group-hover:text-white" :class="$route.path === '/gecmis' ? 'text-white' : 'text-slate-400'" />
          <span class="font-medium">Geçmiş Siparişler</span>
          <div v-if="$route.path === '/gecmis'" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow"></div>
        </NuxtLink>

        <NuxtLink
          to="/teklifler"
          class="nav-item group"
          :class="{ 'active': $route.path.startsWith('/teklifler') }"
        >
          <FileText :size="20" class="transition-colors group-hover:text-white" :class="$route.path.startsWith('/teklifler') ? 'text-white' : 'text-slate-400'" />
          <span class="font-medium">Teklifler</span>
          <div v-if="$route.path.startsWith('/teklifler')" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow"></div>
        </NuxtLink>

        <!-- Admin Section -->
        <template v-if="isAdmin">
          <div class="mt-8 mb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Yönetim</div>
          
          <NuxtLink
            to="/admin/kullanici-onaylari"
            class="nav-item group"
            :class="{ 'active': $route.path === '/admin/kullanici-onaylari' }"
          >
            <Users :size="20" class="transition-colors group-hover:text-white" :class="$route.path === '/admin/kullanici-onaylari' ? 'text-white' : 'text-slate-400'" />
            <span class="font-medium">Kullanıcı Onayları</span>
            <div v-if="$route.path === '/admin/kullanici-onaylari'" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow"></div>
          </NuxtLink>

          <NuxtLink
            to="/admin/loglar"
            class="nav-item group"
            :class="{ 'active': $route.path === '/admin/loglar' }"
          >
            <FileText :size="20" class="transition-colors group-hover:text-white" :class="$route.path === '/admin/loglar' ? 'text-white' : 'text-slate-400'" />
            <span class="font-medium">Sistem Logları</span>
            <div v-if="$route.path === '/admin/loglar'" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow"></div>
          </NuxtLink>
        </template>
      </nav>

      <!-- User Profile (Bottom Sidebar) -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/30">
        <div class="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-md">
            {{ user?.name?.charAt(0) }}{{ user?.surname?.charAt(0) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white truncate">{{ user?.name }} {{ user?.surname }}</p>
            <p class="text-xs text-slate-400 flex items-center gap-1">
              <Shield :size="10" v-if="user?.role === 'yonetici'" class="text-amber-400" />
              <User :size="10" v-else class="text-blue-400" />
              {{ user?.role === 'yonetici' ? 'Yönetici' : 'Personel' }}
            </p>
          </div>
          <button
            @click="handleLogout"
            class="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Çıkış Yap"
          >
            <LogOut :size="18" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div 
      class="flex-1 flex flex-col min-h-screen transition-all duration-300 w-full"
      :class="[isMobileMenuOpen ? 'overflow-hidden' : '', 'lg:ml-72']"
    >
      <!-- Top Header -->
      <header class="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div class="flex items-center justify-between px-4 sm:px-8 py-4">
          <div class="flex items-center gap-4">
            <!-- Mobile Menu Toggle -->
            <button 
              @click="isMobileMenuOpen = !isMobileMenuOpen"
              class="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MenuIcon :size="24" />
            </button>

            <div>
              <h2 class="text-lg sm:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                {{ pageTitle }}
              </h2>
              <p class="text-xs sm:text-sm text-slate-500">{{ currentDate }}</p>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <!-- Clock Widget -->
            <div class="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-mono text-sm font-medium">
              <Clock :size="16" class="text-primary-500" />
              <span>{{ currentTime }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-4 sm:p-8 overflow-x-hidden">
        <div class="max-w-7xl mx-auto animate-fade-in">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { 
  LayoutDashboard, 
  Package, 
  RefreshCw, 
  History, 
  Users, 
  FileText,
  Clock,
  LogOut,
  User,
  Shield,
  Sparkles,
  PieChart,
  Menu as MenuIcon,
  X
} from 'lucide-vue-next';

const { user, isAdmin, logout, fetchCurrentUser } = useAuth();
const currentTime = ref('');
const currentDate = ref('');
const isMobileMenuOpen = ref(false);

const route = useRoute();

// Close menu on route change
watch(() => route.path, () => {
  isMobileMenuOpen.value = false;
});

const pageTitle = computed(() => {
  switch (route.path) {
    case '/': return 'Genel Bakış';
    case '/stok': return 'Stok Yönetimi';
    case '/aktif-isler': return 'Siparişler';
    case '/gecmis': return 'Geçmiş Siparişler';
    case '/admin/kullanici-onaylari': return 'Kullanıcı Onayları';
    case '/admin/loglar': return 'Sistem Logları';
    default: return 'Doğu AŞ Stok ve Süreç Takip Sistemi';
  }
});

// Fetch current user on mount
onMounted(async () => {
  await fetchCurrentUser();
  updateClock();
  setInterval(updateClock, 1000);
});

const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  currentDate.value = now.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });
};

const handleLogout = () => {
  if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
    logout();
  }
};
</script>

<style scoped>
.nav-item {
  @apply flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-white mb-1;
}

.nav-item.active {
  @apply bg-slate-800 text-white shadow-lg shadow-black/20;
}
</style>
