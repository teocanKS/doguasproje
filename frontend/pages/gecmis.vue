<template>
  <div>
    <h1 class="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
      <div class="p-2 bg-indigo-50 rounded-xl text-indigo-600">
        <History :size="32" />
      </div>
      Geçmiş Siparişler
    </h1>

    <!-- Advanced Filters -->
    <div class="glass-card p-6 mb-8">
      <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Filter :size="20" class="text-primary-600" />
        Filtreleme
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div>
          <label class="label">Başlangıç Tarihi</label>
          <input v-model="filters.startDate" type="date" class="input" />
        </div>

        <div>
          <label class="label">Bitiş Tarihi</label>
          <input v-model="filters.endDate" type="date" class="input" />
        </div>

        <div>
          <label class="label">İşlem Tipi</label>
          <select v-model="filters.type" @change="handleTypeChange" class="input">
            <option value="">Tümü</option>
            <option value="Alış">Alış (Tedarikçi)</option>
            <option value="Satış">Satış (Müşteri)</option>
          </select>
        </div>

        <div v-if="filters.type">
          <label class="label">{{ filters.type === 'Satış' ? 'Müşteri' : 'Tedarikçi' }}</label>
          <select v-model="filters.tarafId" class="input">
             <option value="">Tümü</option>
             <option v-for="party in filteredParties" :key="party.id" :value="party.id">
               {{ party.name }}
             </option>
          </select>
        </div>

        <div>
          <label class="label">Ürün</label>
          <select v-model="filters.urunIds" class="input" multiple size="1">
            <option v-for="urun in products" :key="urun.id" :value="urun.id">
              {{ urun.urun_adi }}
            </option>
          </select>
        </div>

        <div>
          <label class="label">Sıralama</label>
          <select v-model="selectedSort" @change="handleSortChange" class="input font-medium text-indigo-600 bg-indigo-50 border-indigo-200">
            <option value="tarih-DESC">Tarih (En Yeni)</option>
            <option value="tarih-ASC">Tarih (En Eski)</option>
            <option value="toplam-DESC">Tutar (En Yüksek)</option>
            <option value="toplam-ASC">Tutar (En Düşük)</option>
            <option value="memnuniyet-DESC">Memnuniyet (En Yüksek)</option>
            <option value="memnuniyet-ASC">Memnuniyet (En Düşük)</option>
          </select>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <button @click="fetchHistory" class="btn btn-primary px-8 flex items-center gap-2">
          <Filter :size="18" />
          Filtrele
        </button>
      </div>
    </div>

    <!-- History Table -->
    <div class="glass-card p-6">
      <div v-if="loading" class="py-12 flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="historyData && historyData.length > 0">
        <!-- Desktop Table View -->
        <div class="hidden md:block table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th @click="handleSort('tarih')" class="cursor-pointer hover:bg-slate-100 transition-colors group select-none">
                  <div class="flex items-center gap-1">
                    Tarih
                    <ArrowUpDown :size="14" class="text-slate-400 group-hover:text-primary-600" :class="{'text-primary-600': sortState.column === 'tarih'}" />
                  </div>
                </th>
                <th>İşlem</th>
                <th>Taraf</th>
                <th>Ürün</th>
                <th @click="handleSort('toplam')" class="cursor-pointer hover:bg-slate-100 transition-colors group select-none">
                  <div class="flex items-center gap-1">
                    Toplam
                    <ArrowUpDown :size="14" class="text-slate-400 group-hover:text-primary-600" :class="{'text-primary-600': sortState.column === 'toplam'}" />
                  </div>
                </th>
                <th @click="handleSort('memnuniyet')" class="cursor-pointer hover:bg-slate-100 transition-colors group select-none">
                  <div class="flex items-center gap-1">
                    Memnuniyet
                    <ArrowUpDown :size="14" class="text-slate-400 group-hover:text-primary-600" :class="{'text-primary-600': sortState.column === 'memnuniyet'}" />
                  </div>
                </th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="item in historyData" 
                :key="item.id"
                :class="getRowClass(item.gun_farki)"
                class="hover:bg-opacity-80 transition-colors cursor-default group"
              >
                <td>
                  <div class="font-medium text-slate-800">{{ formatDate(item.tarih) }}</div>
                  <div class="text-xs text-slate-500">{{ item.gun_farki }} gün önce</div>
                </td>
                <td>
                  <span 
                    class="badge flex items-center gap-1 w-fit"
                    :class="item.islem_tipi === 'Satış' ? 'badge-success' : 'badge-info'"
                  >
                    <ShoppingCart v-if="item.islem_tipi === 'Satış'" :size="12" />
                    <Truck v-else :size="12" />
                    {{ item.islem_tipi }}
                  </span>
                </td>
                <td class="font-medium text-slate-700">{{ item.taraf_adi }}</td>
                <td>
                  <div class="text-sm font-medium text-slate-800">{{ item.urun_adi }}</div>
                  <div class="text-xs text-slate-500">{{ item.adet }} adet</div>
                </td>
                <td class="font-bold text-primary-600 whitespace-nowrap">
                  {{ parseFloat(item.toplam || 0).toFixed(2) }} ₺
                </td>
                <td>
                  <div v-if="item.islem_tipi === 'Alış'" class="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg w-fit border border-yellow-100">
                    <Star :size="14" class="fill-yellow-400 text-yellow-400" />
                    <span class="text-sm font-bold text-yellow-700">
                      {{ (item.memnuniyet || 0).toFixed(1) }}
                    </span>
                  </div>
                  <div v-else class="text-slate-400 text-xs">-</div>
                </td>
                <td>
                  <div v-if="item.gun_farki >= 150" class="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-lg w-fit border border-red-100 animate-pulse-slow">
                    <AlertCircle :size="16" />
                    <span class="text-xs font-bold">Kritik!</span>
                  </div>
                  <div v-else class="flex items-center gap-2">
                    <span class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{{ item.durum }}</span>
                    <button @click="openModal(item)" class="btn btn-xs btn-secondary flex items-center gap-1">
                      <Eye :size="12" />
                      Detay
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden space-y-4">
          <div 
            v-for="item in historyData" 
            :key="item.id" 
            class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"
          >
            <!-- Colored strip based on transaction type -->
            <div 
              class="absolute left-0 top-0 bottom-0 w-1.5"
              :class="item.islem_tipi === 'Satış' ? 'bg-green-500' : 'bg-blue-500'"
            ></div>

            <div class="pl-3">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <div class="text-xs text-slate-500 flex items-center gap-1">
                    <History :size="12" />
                    {{ formatDate(item.tarih) }}
                    <span class="text-slate-300">•</span>
                    {{ item.gun_farki }} gün önce
                  </div>
                  <h3 class="font-bold text-slate-900 mt-1">{{ item.taraf_adi }}</h3>
                </div>
                <span 
                  class="badge flex items-center gap-1"
                  :class="item.islem_tipi === 'Satış' ? 'badge-success' : 'badge-info'"
                >
                  {{ item.islem_tipi }}
                </span>
              </div>

              <div class="py-3 border-t border-b border-slate-100 my-2">
                <div class="flex justify-between items-center">
                  <div>
                    <div class="font-medium text-slate-800">{{ item.urun_adi }}</div>
                    <div class="text-xs text-slate-500 mt-0.5">{{ item.adet }} adet</div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold text-primary-600">
                      {{ parseFloat(item.toplam || 0).toFixed(2) }} ₺
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex justify-between items-center mt-2">
                <div v-if="item.islem_tipi === 'Alış'" class="flex items-center gap-1">
                  <Star :size="14" class="fill-yellow-400 text-yellow-400" />
                  <span class="text-sm font-medium text-slate-700">
                    {{ (item.memnuniyet || 0).toFixed(1) }}
                  </span>
                </div>
                <div v-else></div>

                <div>
                  <div v-if="item.gun_farki >= 150" class="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                    <AlertCircle :size="14" />
                    <span class="text-xs font-bold">Kritik!</span>
                  </div>
                  <span v-else class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{{ item.durum }}</span>
                  <button @click="openModal(item)" class="ml-2 btn btn-xs btn-secondary">Detay</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div class="flex items-center justify-between mt-6 border-t border-slate-100 pt-4">
          <div class="text-sm text-slate-500">
            Toplam <span class="font-medium text-slate-900">{{ pagination.totalCount }}</span> kayıttan 
            <span class="font-medium text-slate-900">{{ (pagination.page - 1) * pagination.limit + 1 }}</span> - 
            <span class="font-medium text-slate-900">{{ Math.min(pagination.page * pagination.limit, pagination.totalCount) }}</span> arası gösteriliyor
          </div>
          
          <div class="flex items-center gap-2">
            <button 
              @click="changePage(pagination.page - 1)" 
              :disabled="pagination.page <= 1"
              class="btn btn-sm btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft :size="16" />
              Önceki
            </button>
            
            <div class="flex items-center gap-1">
              <button 
                v-for="p in visiblePages" 
                :key="p"
                @click="changePage(p)"
                class="w-8 h-8 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                :class="p === pagination.page ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'"
              >
                {{ p }}
              </button>
            </div>

            <button 
              @click="changePage(pagination.page + 1)" 
              :disabled="pagination.page >= pagination.totalPages"
              class="btn btn-sm btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap justify-center gap-3 text-xs font-medium text-slate-600">
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50 border border-green-100">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>0-30 gün</span>
          </div>
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50/50 border border-green-100/50">
            <div class="w-2 h-2 bg-green-300 rounded-full"></div>
            <span>31-60 gün</span>
          </div>
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-50 border border-yellow-100">
            <div class="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span>61-90 gün</span>
          </div>
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-50 border border-orange-100">
            <div class="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span>91-120 gün</span>
          </div>
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 border border-red-100">
            <div class="w-2 h-2 bg-red-400 rounded-full"></div>
            <span>121-150 gün</span>
          </div>
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-100 border border-red-200 text-red-700">
            <div class="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span>150+ gün (Kritik!)</span>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <History :size="48" class="mx-auto text-slate-300 mb-3" />
        <h3 class="text-lg font-medium text-slate-900">İşlem bulunamadı</h3>
        <p class="text-slate-500">Filtreleri değiştirerek tekrar deneyin.</p>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showModal && selectedOrder" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg" :class="selectedOrder.islem_tipi === 'Satış' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'">
              <ShoppingCart v-if="selectedOrder.islem_tipi === 'Satış'" :size="20" />
              <Truck v-else :size="20" />
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-lg">İşlem Detayı</h3>
              <p class="text-xs text-slate-500">{{ formatDate(selectedOrder.tarih) }}</p>
            </div>
          </div>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 transition-colors">
            <X :size="24" />
          </button>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-slate-50 rounded-xl">
              <span class="text-xs text-slate-500 block mb-1">Taraf</span>
              <span class="font-bold text-slate-800">{{ selectedOrder.taraf_adi }}</span>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl">
              <span class="text-xs text-slate-500 block mb-1">İşlem Tipi</span>
              <span class="font-bold" :class="selectedOrder.islem_tipi === 'Satış' ? 'text-green-600' : 'text-blue-600'">{{ selectedOrder.islem_tipi }}</span>
            </div>
          </div>

          <div class="border border-slate-100 rounded-xl p-4">
            <h4 class="font-medium text-slate-900 mb-3 flex items-center gap-2">
              <Package :size="16" class="text-slate-400" />
              Ürün Bilgileri
            </h4>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-slate-50">
                <span class="text-slate-600">Ürün Adı</span>
                <span class="font-medium text-slate-900">{{ selectedOrder.urun_adi }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-slate-50">
                <span class="text-slate-600">Miktar</span>
                <span class="font-medium text-slate-900">{{ selectedOrder.adet }} Adet</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-slate-50">
                <span class="text-slate-600">Birim Fiyat</span>
                <span class="font-medium text-slate-900">{{ parseFloat(selectedOrder.birim_fiyat || 0).toFixed(2) }} ₺</span>
              </div>
              <div class="flex justify-between items-center pt-2">
                <span class="text-slate-800 font-bold">Toplam Tutar</span>
                <span class="text-lg font-bold text-primary-600">{{ parseFloat(selectedOrder.toplam || 0).toFixed(2) }} ₺</span>
              </div>
            </div>
          </div>

          <div v-if="selectedOrder.durum === 'TAMAMLANDI'" class="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700 text-sm font-medium">
             <div class="w-2 h-2 rounded-full bg-green-500"></div>
             Bu işlem başarıyla tamamlanmıştır.
          </div>
        </div>

        <div class="p-4 bg-slate-50 flex justify-end">
          <button @click="closeModal" class="btn btn-primary w-full md:w-auto">Kapat</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { History, Filter, ShoppingCart, Truck, Star, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight, Eye, X, Package } from 'lucide-vue-next';

definePageMeta({
  middleware: 'auth',
});

const { apiFetch } = useApi();

const historyData = ref([]);
const pagination = ref({
  page: 1,
  limit: 30,
  totalCount: 0,
  totalPages: 1
});
const loading = ref(true);
const products = ref([]);
const customers = ref([]);
const suppliers = ref([]);

const filters = ref({
  startDate: '',
  endDate: '',
  type: '',
  urunIds: [],
  tarafId: '',
});

const filteredParties = computed(() => {
  if (filters.value.type === 'Satış') {
    return customers.value.map(c => ({ id: c.id, name: c.musteri_adi }));
  } else if (filters.value.type === 'Alış') {
    return suppliers.value.map(s => ({ id: s.id, name: s.tedarikci_adi }));
  }
  return [];
});

const handleTypeChange = () => {
  filters.value.tarafId = ''; // Reset selection when type changes
};

const selectedSort = ref('tarih-DESC');

const sortState = ref({
  column: 'tarih',
  direction: 'DESC'
});

const visiblePages = computed(() => {
  const { page, totalPages } = pagination.value;
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      range.push(i);
    }
  }
  return range;
});

const showModal = ref(false);
const selectedOrder = ref(null);

const openModal = (item) => {
  selectedOrder.value = item;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedOrder.value = null;
};

onMounted(async () => {
  await Promise.all([
    fetchProducts(),
    fetchParties(),
    fetchHistory(),
  ]);
});

const fetchProducts = async () => {
  try {
    const response = await apiFetch('/products?limit=1000');
    products.value = response.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
  }
};

const fetchParties = async () => {
  try {
    const [custRes, suppRes] = await Promise.all([
      apiFetch('/jobs/parties/customers'),
      apiFetch('/jobs/parties/suppliers')
    ]);
    customers.value = custRes.data || [];
    suppliers.value = suppRes.data || [];
  } catch (error) {
    console.error('Error fetching parties:', error);
  }
};

const handleSortChange = () => {
  const [column, direction] = selectedSort.value.split('-');
  sortState.value.column = column;
  sortState.value.direction = direction;
  fetchHistory();
};

const handleSort = (column) => {
  // Keep table header click functionality but sync with dropdown
  if (sortState.value.column === column) {
    sortState.value.direction = sortState.value.direction === 'DESC' ? 'ASC' : 'DESC';
  } else {
    sortState.value.column = column;
    sortState.value.direction = 'DESC';
  }
  selectedSort.value = `${sortState.value.column}-${sortState.value.direction}`;
  fetchHistory();
};

const fetchHistory = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (filters.value.startDate) params.append('startDate', filters.value.startDate);
    if (filters.value.endDate) params.append('endDate', filters.value.endDate);
    if (filters.value.type) params.append('type', filters.value.type);
    if (filters.value.tarafId) params.append('tarafId', filters.value.tarafId);
    
    // Add sorting params
    params.append('sortBy', sortState.value.column);
    params.append('sortOrder', sortState.value.direction);
    
    const validUrunIds = filters.value.urunIds.filter(id => id);
    if (validUrunIds.length > 0) params.append('urunIds', validUrunIds.join(','));



    // Pagination params
    params.append('page', pagination.value.page);
    params.append('limit', pagination.value.limit);

    const response = await apiFetch(`/history/detailed?${params.toString()}`);
    historyData.value = response.data || [];
    if (response.pagination) {
      pagination.value = response.pagination;
    }
  } catch (error) {
    console.error('Error fetching history:', error);
    historyData.value = [];
  } finally {
    loading.value = false;
  }
};

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= pagination.value.totalPages) {
    pagination.value.page = newPage;
    fetchHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const getRowClass = (gunFarki) => {
  if (gunFarki <= 30) return 'bg-green-50 hover:bg-green-100';
  if (gunFarki <= 60) return 'bg-green-50/50 hover:bg-green-100/50';
  if (gunFarki <= 90) return 'bg-yellow-50 hover:bg-yellow-100';
  if (gunFarki <= 120) return 'bg-orange-50 hover:bg-orange-100';
  if (gunFarki <= 150) return 'bg-red-50 hover:bg-red-100';
  return 'bg-red-100 hover:bg-red-200 font-semibold';
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR');
};


</script>
