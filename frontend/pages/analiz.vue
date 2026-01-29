<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div class="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <PieChart :size="32" />
          </div>
          Detaylı Analiz
        </h1>
        <p class="text-slate-500 mt-1 ml-14">Stok durumu, referans değerleri ve yapay zeka destekli içgörüler.</p>
      </div>
      
      <div class="flex gap-2 items-center">
        <!-- Pagination Buttons -->
        <div class="flex gap-2 mr-4 bg-slate-100 p-1 rounded-lg">
          <button 
            @click="currentPage = 1" 
            :class="{'bg-white text-indigo-600 shadow-sm': currentPage === 1, 'text-slate-500 hover:text-slate-700': currentPage !== 1}"
            class="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
          >
            Genel
          </button>
          <button 
            @click="currentPage = 2" 
            :class="{'bg-white text-indigo-600 shadow-sm': currentPage === 2, 'text-slate-500 hover:text-slate-700': currentPage !== 2}"
            class="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
          >
            Stok
          </button>
        </div>

        <button @click="refreshData" class="btn btn-secondary flex items-center gap-2">
          <RefreshCw :size="18" :class="{ 'animate-spin': loading }" />
          Yenile
        </button>
      </div>
    </div>

    <div v-if="loading" class="py-20 flex justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>

    <div v-else class="space-y-8">
      
      <!-- Page 1 Content -->
      <div v-if="currentPage === 1" class="space-y-8">
        <!-- AI Insights Section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            v-for="(insight, index) in insights" 
            :key="index"
            class="glass-card p-6 border-l-4"
            :class="{
              'border-green-500': insight.type === 'positive',
              'border-red-500': insight.type === 'negative',
              'border-blue-500': insight.type === 'info'
            }"
          >
            <div class="flex items-start gap-4">
              <div 
                class="p-2 rounded-lg"
                :class="{
                  'bg-green-50 text-green-600': insight.type === 'positive',
                  'bg-red-50 text-red-600': insight.type === 'negative',
                  'bg-blue-50 text-blue-600': insight.type === 'info'
                }"
              >
                <TrendingUp v-if="insight.type === 'positive'" :size="24" />
                <TrendingDown v-else-if="insight.type === 'negative'" :size="24" />
                <Info v-else :size="24" />
              </div>
              <div>
                <h3 class="font-bold text-slate-800">{{ insight.title }}</h3>
                <p class="text-sm text-slate-600 mt-1 leading-relaxed">{{ insight.message }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Category Distribution (Pie) -->
          <div class="glass-card p-6 lg:col-span-1">
            <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <PieChart :size="20" class="text-slate-400" />
              Kategori Bazlı Satış Dağılımı
            </h3>
            <div class="h-80 relative flex justify-center">
              <Pie v-if="categoryData" :data="categoryData" :options="pieOptions" />
              <div v-else class="flex items-center justify-center h-full text-slate-400">Veri yok</div>
            </div>
          </div>

          <!-- Top 5 Profitable Customers -->
          <div class="glass-card p-6 lg:col-span-2">
            <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Users :size="20" class="text-pink-500" />
              En Çok Kâr Getiren Top 5 Müşteri
            </h3>
            <div class="h-80 relative">
              <Bar v-if="customerData" :data="customerData" :options="customerChartOptions" />
              <div v-else class="flex items-center justify-center h-full text-slate-500">Veri yok</div>
            </div>
          </div>

          <!-- Profit Margin Analysis -->
          <div class="glass-card p-6 lg:col-span-3">
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp :size="20" class="text-green-500" />
                Ürün Bazlı Kar Marjı Analizi
              </h3>
              
              <div class="w-full md:w-64">
                <select 
                  v-model="selectedProductId" 
                  @change="fetchProfitData"
                  class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="" disabled>Ürün Seçiniz</option>
                  <option v-for="product in products" :key="product.urun_id" :value="product.urun_id">
                    {{ product.urun_adi }}
                  </option>
                </select>
              </div>
            </div>

            <div class="h-80 relative flex justify-center">
              <Bar v-if="profitData" :data="profitData" :options="profitChartOptions" />
              <div v-else-if="!selectedProductId" class="flex items-center justify-center h-full text-slate-400">
                Analiz için lütfen bir ürün seçiniz.
              </div>
              <div v-else class="flex items-center justify-center h-full text-slate-400">
                Bu ürün için yeterli veri yok.
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Page 2 Content: Stock Analysis (Full Width) -->
      <div v-if="currentPage === 2" class="glass-card p-6">
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart :size="20" class="text-indigo-500" />
            Kritik Stok vs Referans Değeri
          </h3>
          
          <div class="flex items-center gap-4">
            <select 
              v-model="selectedStockCategory" 
              @change="fetchStockData"
              class="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 text-sm"
            >
              <option value="">Tüm Kategoriler</option>
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>

            <div class="flex items-center gap-4 text-sm hidden md:flex">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded bg-indigo-500 opacity-20 border border-indigo-500"></div>
                <span class="text-slate-600">Mevcut Stok</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-1 bg-red-500 rounded-full"></div>
                <span class="text-slate-600">Referans Değeri</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Taller chart for better readability -->
        <div class="h-[600px] relative">
          <Chart v-if="stockData" type="bar" :data="stockData" :options="stockChartOptions" />
          <div v-else class="flex items-center justify-center h-full text-slate-500">Veri yok</div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { 
  PieChart, BarChart, RefreshCw, 
  TrendingUp, TrendingDown, Info, Users
} from 'lucide-vue-next';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  BarController,
  LineController
} from 'chart.js';
import { Pie, Bar, Chart } from 'vue-chartjs';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register ChartJS components and plugin
ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title,
  BarController, LineController,
  ChartDataLabels
);

definePageMeta({
  middleware: 'auth',
});

const { apiFetch } = useApi();
const loading = ref(true);
const currentPage = ref(1);

const categoryData = ref(null);
const stockData = ref(null);
const customerData = ref(null);
const insights = ref([]);
const categories = ref([]);
const selectedStockCategory = ref('');

// Profit Analysis State
const products = ref([]);
const selectedProductId = ref('');
const profitData = ref(null);

// Chart Options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: { family: "'Inter', sans-serif", size: 12 },
        usePointStyle: true,
        padding: 20
      }
    },
    datalabels: {
      display: true,
      color: '#334155',
      font: { weight: 'bold' },
      formatter: (value, ctx) => {
        return value;
      }
    }
  }
};

const pieOptions = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    datalabels: {
      color: '#fff',
      formatter: (value, ctx) => {
        let sum = 0;
        let dataArr = ctx.chart.data.datasets[0].data;
        dataArr.map(data => {
          sum += data;
        });
        let percentage = (value * 100 / sum).toFixed(1) + "%";
        return percentage;
      }
    }
  }
};

const profitChartOptions = {
  ...commonOptions,
  plugins: {
    legend: { display: false },
    datalabels: {
      color: '#fff',
      anchor: 'end',
      align: 'start',
      offset: -20,
      formatter: (value) => Math.round(value) + ' TL'
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `${context.parsed.y.toLocaleString('tr-TR')} TL`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: {
        callback: (value) => `${value} TL`
      }
    },
    x: {
      grid: { display: false }
    }
  }
};

const stockChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    datalabels: {
      display: false 
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1e293b',
      bodyColor: '#475569',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 10
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { color: '#64748b' },
      title: { display: false }
    },
    x: {
      grid: { display: false },
      ticks: { 
        color: '#64748b', // Default, will be overwritten
        callback: function(val, index) {
          // Truncate long labels
          const label = this.getLabelForValue(val);
          if (label.length > 10) {
            return label.substr(0, 10) + '...';
          }
          return label;
        }
      },
      title: { 
        display: true, 
        text: 'Ürün',
        color: '#94a3b8',
        font: { size: 12 }
      }
    }
  }
});

const customerChartOptions = {
  indexAxis: 'y', // Horizontal bar
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    datalabels: {
      color: '#fff',
      anchor: 'end',
      align: 'start',
      offset: -40,
      formatter: (value) => Math.round(value).toLocaleString('tr-TR') + ' TL'
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { display: false } // Hide x-axis numbers as we have data labels
    },
    y: {
      grid: { display: false },
      ticks: { 
        color: '#334155',
        font: { weight: 'bold' }
      }
    }
  }
};

onMounted(() => {
  refreshData();
});

const refreshData = async () => {
  loading.value = true;
  try {
    const [catRes, stockRes, insightRes, prodRes, custRes, catsRes] = await Promise.all([
      apiFetch('/analysis/category-sales'),
      apiFetch('/analysis/stock-analysis'),
      apiFetch('/analysis/insights'),
      apiFetch('/analysis/products'),
      apiFetch('/analysis/top-customers'),
      apiFetch('/products/categories')
    ]);

    if (catRes.success) categoryData.value = catRes.chartData;
    if (stockRes.success) {
      stockData.value = stockRes.chartData;
      if (stockRes.chartData.xLabelColors) {
        stockChartOptions.value = {
          ...stockChartOptions.value,
          scales: {
            ...stockChartOptions.value.scales,
            x: {
              ...stockChartOptions.value.scales.x,
              ticks: {
                ...stockChartOptions.value.scales.x.ticks,
                color: stockRes.chartData.xLabelColors
              }
            }
          }
        };
      }
    }
    if (insightRes.success) insights.value = insightRes.insights;
    if (prodRes.success) products.value = prodRes.products;
    if (custRes.success) customerData.value = custRes.chartData;
    if (catsRes.success) categories.value = catsRes.categories;

  } catch (error) {
    console.error('Analysis data fetch error:', error);
  } finally {
    loading.value = false;
  }
};

const fetchStockData = async () => {
  try {
    const url = selectedStockCategory.value 
      ? `/analysis/stock-analysis?category=${encodeURIComponent(selectedStockCategory.value)}`
      : '/analysis/stock-analysis';
      
    const res = await apiFetch(url);
    if (res.success) {
      stockData.value = res.chartData;
      // Update tick colors if provided
      if (res.chartData.xLabelColors) {
        stockChartOptions.value = {
          ...stockChartOptions.value,
          scales: {
            ...stockChartOptions.value.scales,
            x: {
              ...stockChartOptions.value.scales.x,
              ticks: {
                ...stockChartOptions.value.scales.x.ticks,
                color: res.chartData.xLabelColors
              }
            }
          }
        };
      }
    }
  } catch (error) {
    console.error('Stock data fetch error:', error);
  }
};

const fetchProfitData = async () => {
  if (!selectedProductId.value) return;
  
  try {
    const res = await apiFetch(`/analysis/profit-analysis?urunId=${selectedProductId.value}`);
    if (res.success) {
      profitData.value = res.chartData;
    }
  } catch (error) {
    console.error('Profit data fetch error:', error);
  }
};
</script>
