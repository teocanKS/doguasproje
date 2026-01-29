<template>
  <div>
    <h1 class="text-4xl font-bold text-gray-900 mb-8 flex items-center gap-3">
      <Package :size="32" class="text-green-600" />
      Stok Durumu
    </h1>

    <!-- Modern Search and Filter Card -->
    <div class="glass-card p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div>
          <label class="label">
            <Search :size="16" class="inline mr-1" />
            Ürün Ara
          </label>
          <input
            v-model="searchQuery"
            type="text"
            class="input"
            placeholder="Ürün adı ile arayın..."
          />
        </div>

        <div>
          <label class="label">
            <Filter :size="16" class="inline mr-1" />
            Kategori
          </label>
          <select v-model="selectedCategory" class="input">
            <option value="">Tüm Kategoriler</option>
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <div>
          <button @click="fetchStock" class="btn btn-primary w-full flex items-center justify-center gap-2">
            <RefreshCw :size="18" />
            Listeyi Güncelle
          </button>
        </div>
      </div>
    </div>

    <!-- Modern Stock Table -->
    <div class="glass-card p-6">
      <div v-if="loading" class="py-12 flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="stockData && stockData.length > 0">
        <!-- Desktop Table View -->
        <div class="hidden md:block table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Ürün Adı</th>
                <th>Kategori</th>
                <th>Mevcut Stok</th>
                <th>Kritik Seviye</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in stockData"
                :key="item.id"
                :class="{ 'bg-red-50/50 hover:bg-red-50': item.is_critical }"
                class="group"
              >
                <td class="font-medium text-slate-900">
                  <div class="flex items-center gap-2">
                    <AlertTriangle v-if="item.is_critical" :size="18" class="text-red-500 animate-pulse" />
                    {{ item.urun_adi }}
                  </div>
                </td>
                <td>
                  <span class="badge badge-neutral">{{ item.kategori }}</span>
                </td>
                <td>
                  <div class="flex items-baseline gap-1">
                    <span class="text-lg font-bold" :class="item.is_critical ? 'text-red-600' : 'text-slate-700'">
                      {{ item.toplam_stok }}
                    </span>
                    <span class="text-xs text-slate-500">{{ item.birim }}</span>
                  </div>
                </td>
                <td class="text-slate-500 font-medium">{{ item.referans_degeri }}</td>
                <td>
                  <span
                    v-if="item.is_critical"
                    class="badge badge-danger flex items-center gap-1 w-fit animate-pulse-slow"
                  >
                    <AlertCircle :size="14" />
                    KRİTİK
                  </span>
                  <span
                    v-else
                    class="badge badge-success flex items-center gap-1 w-fit"
                  >
                    <CheckCircle :size="14" />
                    Normal
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden space-y-4">
          <div 
            v-for="item in stockData" 
            :key="item.id"
            class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
            :class="{ 'border-red-200 bg-red-50/30': item.is_critical }"
          >
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-start gap-2">
                <AlertTriangle v-if="item.is_critical" :size="18" class="text-red-500 animate-pulse mt-0.5" />
                <div>
                  <h3 class="font-bold text-slate-900">{{ item.urun_adi }}</h3>
                  <span class="badge badge-neutral mt-1">{{ item.kategori }}</span>
                </div>
              </div>
              <span
                v-if="item.is_critical"
                class="badge badge-danger flex items-center gap-1 px-2 py-1"
              >
                <AlertCircle :size="12" />
                KRİTİK
              </span>
              <span v-else class="badge badge-success px-2 py-1">Normal</span>
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div class="text-center flex-1 border-r border-slate-200">
                <div class="text-xs text-slate-500 mb-0.5">Mevcut Stok</div>
                <div class="flex items-center justify-center gap-1">
                  <span class="text-xl font-bold" :class="item.is_critical ? 'text-red-600' : 'text-slate-800'">
                    {{ item.toplam_stok }}
                  </span>
                  <span class="text-xs text-slate-500 font-medium">{{ item.birim }}</span>
                </div>
              </div>
              <div class="text-center flex-1">
                <div class="text-xs text-slate-500 mb-0.5">Kritik Seviye</div>
                <div class="text-lg font-semibold text-slate-700">{{ item.referans_degeri }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 text-sm text-slate-500 flex items-center justify-between border-t border-slate-100 pt-4">
          <div class="flex items-center gap-2">
            <Database :size="16" />
            <span>Toplam <strong>{{ stockData.length }}</strong> ürün listeleniyor</span>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <Package :size="48" class="mx-auto text-slate-300 mb-3" />
        <h3 class="text-lg font-medium text-slate-900">Ürün bulunamadı</h3>
        <p class="text-slate-500">Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Database
} from 'lucide-vue-next';

definePageMeta({
  middleware: 'auth',
});

const { apiFetch } = useApi();

const stockData = ref([]);
const categories = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedCategory = ref('');

onMounted(async () => {
  await fetchCategories();
  await fetchStock();
});

const fetchCategories = async () => {
  try {
    const response = await apiFetch('/products/categories');
    categories.value = response.categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};

const fetchStock = async () => {
  loading.value = true;
  try {
    const response = await apiFetch('/stock');
    
    // Apply client-side filtering
    let filtered = response.data;
    
    if (searchQuery.value) {
      filtered = filtered.filter(item =>
        item.urun_adi.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    }
    
    if (selectedCategory.value) {
      filtered = filtered.filter(item => item.kategori === selectedCategory.value);
    }
    
    stockData.value = filtered;
  } catch (error) {
    console.error('Error fetching stock:', error);
  } finally {
    loading.value = false;
  }
};
</script>
