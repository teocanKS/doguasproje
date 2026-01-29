<template>
  <div>
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <NuxtLink to="/stok" class="block glass-card p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
        <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Package :size="80" />
        </div>
        <div class="relative z-10">
          <p class="text-slate-500 text-sm font-medium mb-1">Toplam Ürün</p>
          <h3 class="text-3xl font-bold text-slate-800">{{ stats?.totalProducts || 0 }}</h3>
          <div class="mt-4 flex items-center text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-1 rounded-lg">
            <TrendingUp :size="14" class="mr-1" />
            <span>Aktif Envanter</span>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink to="/stok" class="block glass-card p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
        <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-red-600">
          <AlertTriangle :size="80" />
        </div>
        <div class="relative z-10">
          <p class="text-slate-500 text-sm font-medium mb-1">Kritik Stok</p>
          <h3 class="text-3xl font-bold text-slate-800">{{ stats?.lowStockCount || 0 }}</h3>
          <div class="mt-4 flex items-center text-xs font-medium text-red-600 bg-red-50 w-fit px-2 py-1 rounded-lg">
            <AlertCircle :size="14" class="mr-1" />
            <span>Acil Sipariş Gerekli</span>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink to="/gecmis" class="block glass-card p-6 flex items-center justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
          <div class="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-opacity group-hover:opacity-70"></div>
          <div>
            <p class="text-slate-500 text-sm font-medium mb-1">Aktif Siparişler</p>
            <h3 class="text-3xl font-bold text-slate-800">{{ stats?.activeJobsCount || 0 }}</h3>
          </div>
          <div class="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-100 transition-colors shadow-sm">
            <RefreshCw :size="28" />
          </div>
        </NuxtLink>
    </div>

    <!-- Charts Row (Prominent) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Profit Chart (Large) -->
      <div class="lg:col-span-2 glass-card p-6">
        <h2 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div class="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <TrendingUp :size="20" />
          </div>
          Aylık Finansal Özet
        </h2>
        <div class="h-[350px] w-full">
          <canvas ref="profitChartCanvas"></canvas>
        </div>
      </div>

      <!-- Active Products List (Replaces Chart) -->
      <div class="glass-card p-6 flex flex-col">
        <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
            <BarChart3 :size="20" />
          </div>
          Popüler Ürünler
        </h2>
        
        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar" style="max-height: 300px;">
          <div v-if="activeProductsData && activeProductsData.length > 0" class="space-y-5">
            <div v-for="(item, index) in activeProductsData" :key="index" class="group">
              <div class="flex justify-between items-end mb-1.5">
                <span class="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-2" :title="item.urun_adi">
                  {{ item.urun_adi }}
                </span>
                <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {{ item.total_transactions }} işlem
                </span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  class="bg-blue-500 h-2.5 rounded-full transition-all duration-1000 ease-out group-hover:bg-blue-600 relative overflow-hidden"
                  :style="{ width: getPercentage(item.total_transactions) + '%' }"
                >
                  <div class="absolute inset-0 bg-white/20 group-hover:animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="h-full flex flex-col items-center justify-center text-slate-400">
            <BarChart3 :size="48" class="mb-2 opacity-20" />
            <p class="text-sm">Veri bulunamadı</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Lists Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Critical Stock (Compact List) -->
      <div class="glass-card p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div class="p-2 bg-red-50 rounded-lg text-red-600">
              <AlertCircle :size="20" />
            </div>
            Kritik Stok Durumu
          </h2>
          <NuxtLink to="/stok" class="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline">
            Tümünü Gör
          </NuxtLink>
        </div>
        
        <div v-if="loadingStockRisks" class="py-12 flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        <div v-else-if="stockRisks && stockRisks.length > 0" class="space-y-3">
          <div v-for="item in stockRisks.slice(0, 5)" :key="item.id" class="p-3 rounded-xl border border-red-100 bg-red-50/30 hover:bg-red-50/60 transition-colors flex justify-between items-center group">
            <div>
              <h4 class="font-semibold text-slate-800">{{ item.urun_adi }}</h4>
              <span class="text-xs text-slate-500">{{ item.kategori }}</span>
            </div>
            <div class="text-right">
              <div class="flex items-center gap-1.5 justify-end">
                <span class="font-bold text-red-600 text-lg">{{ item.toplam_stok }}</span>
                <span class="text-xs text-slate-400">/ {{ item.referans_degeri }}</span>
              </div>
              <span class="badge badge-danger text-[10px] px-1.5 py-0.5">Kritik</span>
            </div>
          </div>
          <div v-if="stockRisks.length > 5" class="text-center pt-2">
            <span class="text-xs text-slate-500">+{{ stockRisks.length - 5 }} ürün daha</span>
          </div>
        </div>

        <div v-else class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <CheckCircle :size="48" class="mx-auto text-green-500 mb-3 opacity-80" />
          <p class="text-slate-600 font-medium">Harika! Kritik seviyede ürün yok.</p>
        </div>
      </div>

      <!-- Inactivity Alerts (Admin Only) -->
      <div v-if="isAdmin" class="glass-card p-6">
        <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <div class="p-2 bg-orange-50 rounded-lg text-orange-600">
            <BellRing :size="20" />
          </div>
          Müşteri Takibi
        </h2>
        
        <div v-if="loadingInactivity" class="py-12 flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        <div v-else-if="inactivityAlerts && inactivityAlerts.length > 0" class="space-y-3">
          <div
            v-for="customer in inactivityAlerts.slice(0, 5)"
            :key="customer.id"
            class="p-3 rounded-xl border transition-all hover:shadow-sm"
            :class="{
              'bg-red-50/50 border-red-100': customer.alert_level === 'danger',
              'bg-orange-50/50 border-orange-100': customer.alert_level === 'warning',
              'bg-yellow-50/50 border-yellow-100': customer.alert_level === 'caution',
            }"
          >
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-semibold text-slate-800 text-sm">{{ customer.musteri_adi }}</h4>
                <p class="text-xs text-slate-500 mt-0.5">{{ customer.inactivity_days }} gündür işlem yok</p>
              </div>
              <span
                class="badge"
                :class="{
                  'badge-danger': customer.alert_level === 'danger',
                  'badge-warning': customer.alert_level === 'warning',
                  'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200': customer.alert_level === 'caution',
                }"
              >
                {{ customer.alert_level === 'danger' ? 'Kritik' : customer.alert_level === 'warning' ? 'Uyarı' : 'Dikkat' }}
              </span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
          <CheckCircle :size="32" class="mx-auto text-green-500 mb-2 opacity-80" />
          <span class="text-sm text-slate-600">Tüm müşteriler aktif</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Chart, registerables } from 'chart.js';
import { 
  Sparkles, 
  Package, 
  AlertTriangle, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Brain,
  Database,
  BellRing,
  Activity,
  Star
} from 'lucide-vue-next';

definePageMeta({
  middleware: 'auth',
});

Chart.register(...registerables);

const { apiFetch } = useApi();
const { isAdmin } = useAuth();

const stats = ref(null);
const stockRisks = ref([]);
const loadingStockRisks = ref(true);
const profitData = ref([]);
const activeProductsData = ref([]);

const inactivityAlerts = ref([]);
const loadingInactivity = ref(true);

const profitChartCanvas = ref(null);


onMounted(async () => {
  await Promise.all([
    fetchStats(),
    fetchStockRisks(),
    fetchProfitData(),
    fetchActiveProducts(),


    isAdmin.value ? fetchInactivityAlerts() : Promise.resolve(),
  ]);

  renderCharts();
});

const fetchStats = async () => {
  try {
    const response = await apiFetch('/dashboard/stats');
    stats.value = response.stats;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

const fetchStockRisks = async () => {
  try {
    const response = await apiFetch('/stock');
    stockRisks.value = response.data.filter(item => item.is_critical);
  } catch (error) {
    console.error('Error fetching stock risks:', error);
  } finally {
    loadingStockRisks.value = false;
  }
};

const fetchProfitData = async () => {
  try {
    const response = await apiFetch('/dashboard/profit-chart?months=6');
    profitData.value = response.data;
  } catch (error) {
    console.error('Error fetching profit chart:', error);
  }
};

const fetchActiveProducts = async () => {
  try {
    const response = await apiFetch('/dashboard/active-products?limit=10');
    activeProductsData.value = response.data;
  } catch (error) {
    console.error('Error fetching active products:', error);
  }
};





const fetchInactivityAlerts = async () => {
  try {
    const response = await apiFetch('/dashboard/inactivity-alerts');
    inactivityAlerts.value = response.data;
  } catch (error) {
    console.error('Error fetching inactivity alerts:', error);
  } finally {
    loadingInactivity.value = false;
  }
};

const renderCharts = () => {
  nextTick(() => {
    // Common Chart Options
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false, // Allow custom height
      plugins: {
        legend: { display: false },
        datalabels: { display: false }, // Disable data labels to prevent overlapping
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          titleColor: '#1e293b',
          bodyColor: '#475569',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 14,
          cornerRadius: 12,
          titleFont: { family: 'Inter', size: 14, weight: 'bold' },
          bodyFont: { family: 'Inter', size: 13 },
          displayColors: true,
          boxPadding: 4,
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('tr-TR').format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter', size: 12 },
            color: '#64748b'
          }
        },
        y: {
          grid: {
            color: '#f1f5f9',
            borderDash: [6, 6],
            drawBorder: false,
          },
          ticks: {
            font: { family: 'Inter', size: 12 },
            color: '#64748b',
            padding: 10,
            callback: (value) => {
              if (value >= 1000) return (value / 1000) + 'k';
              return value;
            }
          },
          border: { display: false }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      }
    };

    // Helper to create gradient
    const createGradient = (ctx, colorStart, colorEnd) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, colorStart);
      gradient.addColorStop(1, colorEnd);
      return gradient;
    };

    // Profit Chart (Line Chart with Area)
    if (profitChartCanvas.value) {
      const ctx = profitChartCanvas.value.getContext('2d');
      
      // Gradients for positive and negative values
      const positiveGradient = createGradient(ctx, 'rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.0)');
      const negativeGradient = createGradient(ctx, 'rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.0)');

      new Chart(profitChartCanvas.value, {
        type: 'line',
        data: {
          labels: profitData.value.map(d => {
            const [year, month] = d.month.split('-');
            const date = new Date(year, month - 1);
            return new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(date);
          }),
          datasets: [{
            label: 'Kâr',
            data: profitData.value.map(d => d.profit),
            backgroundColor: (context) => {
              const value = context.raw;
              return value < 0 ? negativeGradient : positiveGradient;
            },
            fill: true,
            borderWidth: 3,
            segment: {
              borderColor: (ctx) => ctx.p0.parsed.y < 0 || ctx.p1.parsed.y < 0 ? '#ef4444' : '#10b981',
              backgroundColor: (ctx) => ctx.p0.parsed.y < 0 || ctx.p1.parsed.y < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            },
            pointBackgroundColor: (context) => context.raw < 0 ? '#ef4444' : '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.4,
          }],
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: {
              ...commonOptions.scales.y,
              ticks: {
                font: { family: 'Inter', size: 12 },
                color: '#64748b',
                padding: 10,
                callback: (value) => {
                  if (Math.abs(value) >= 1000) {
                    return (value / 1000) + 'K';
                  }
                  return value;
                }
              }
            }
          },
          plugins: {
            ...commonOptions.plugins,
            tooltip: {
              ...commonOptions.plugins.tooltip,
              callbacks: {
                label: (context) => `Kâr: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(context.parsed.y)}`
              }
            }
          }
        },
      });
    }
  });
};

// Helper to calculate percentage for progress bars
const getPercentage = (value) => {
  if (!activeProductsData.value || activeProductsData.value.length === 0) return 0;
  const max = Math.max(...activeProductsData.value.map(d => parseInt(d.total_transactions)));
  return max === 0 ? 0 : (value / max) * 100;
};
</script>
