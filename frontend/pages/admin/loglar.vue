<template>
  <div>
    <h1 class="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
      <div class="p-2 bg-indigo-50 rounded-xl text-indigo-600">
        <Activity :size="32" />
      </div>
      Sistem Logları
    </h1>

    <div class="glass-card p-6">
      <div v-if="loading" class="py-12 flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="logs && logs.length > 0" class="overflow-x-auto">
        <table class="modern-table mb-6">
          <thead>
            <tr>
              <th>Zaman</th>
              <th>Tablo</th>
              <th>İşlem Tipi</th>
              <th>Kullanıcı / IP</th>
              <th>Değişiklik Özeti</th>
              <th class="text-right">Detay</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" class="group hover:bg-slate-50/50 transition-colors">
              <td class="text-sm font-medium text-slate-600 whitespace-nowrap">
                {{ new Date(log.islem_zamani).toLocaleString('tr-TR') }}
              </td>
              <td>
                <span class="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                  {{ log.tablo_adi }}
                </span>
              </td>
              <td>
                <span
                  class="badge flex items-center gap-1.5 w-fit"
                  :class="{
                    'badge-success': log.islem_tipi === 'INSERT',
                    'badge-info': log.islem_tipi === 'UPDATE',
                    'badge-danger': log.islem_tipi === 'DELETE',
                    'bg-purple-100 text-purple-700 ring-1 ring-purple-200': log.islem_tipi === 'LOGIN'
                  }"
                >
                  <PlusCircle v-if="log.islem_tipi === 'INSERT'" :size="12" />
                  <Edit2 v-else-if="log.islem_tipi === 'UPDATE'" :size="12" />
                  <Trash2 v-else-if="log.islem_tipi === 'DELETE'" :size="12" />
                  <LogIn v-else-if="log.islem_tipi === 'LOGIN'" :size="12" />
                  {{ log.islem_tipi }}
                </span>
              </td>
              <td>
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-slate-800">{{ log.kullanici_adi || 'Sistem' }}</span>
                  <span v-if="getIpAddress(log)" class="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Globe :size="10" />
                    {{ getIpAddress(log) }}
                  </span>
                </div>
              </td>
              <td class="max-w-xs truncate text-sm text-slate-600">
                {{ getChangeSummary(log) }}
              </td>
              <td class="text-right">
                <button
                  @click="viewLogDetail(log)"
                  class="btn btn-sm btn-secondary text-xs"
                >
                  <Eye :size="14" class="mr-1" />
                  İncele
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-100">
          <div class="flex flex-1 justify-between sm:hidden">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="btn btn-sm btn-secondary"
            >
              Önceki
            </button>
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="btn btn-sm btn-secondary ml-3"
            >
              Sonraki
            </button>
          </div>
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-slate-500">
                Toplam <span class="font-medium text-slate-900">{{ totalCount }}</span> kayıttan
                <span class="font-medium text-slate-900">{{ (currentPage - 1) * limit + 1 }}</span> -
                <span class="font-medium text-slate-900">{{ Math.min(currentPage * limit, totalCount) }}</span> arası gösteriliyor
              </p>
            </div>
            <div>
              <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  @click="changePage(currentPage - 1)"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center rounded-l-lg px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span class="sr-only">Önceki</span>
                  <ChevronLeft :size="20" />
                </button>
                
                <span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-200 focus:outline-offset-0 bg-white">
                  Sayfa {{ currentPage }} / {{ totalPages }}
                </span>

                <button
                  @click="changePage(currentPage + 1)"
                  :disabled="currentPage === totalPages"
                  class="relative inline-flex items-center rounded-r-lg px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span class="sr-only">Sonraki</span>
                  <ChevronRight :size="20" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <Activity :size="48" class="mx-auto text-slate-300 mb-3" />
        <h3 class="text-lg font-medium text-slate-900">Log kaydı bulunamadı</h3>
        <p class="text-slate-500">Sistemde henüz kaydedilmiş bir işlem yok.</p>
      </div>
    </div>

    <!-- Log Detail Modal -->
    <div
      v-if="showDetailModal && selectedLog"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <div class="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <FileText :size="24" />
            </div>
            <div>
              <h2 class="text-2xl font-bold text-slate-800">İşlem Detayı</h2>
              <p class="text-sm text-slate-500">Log ID: #{{ selectedLog.id }}</p>
            </div>
          </div>
          <button @click="showDetailModal = false" class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X :size="24" />
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-sm text-slate-500">Tablo</span>
              <code class="text-sm font-mono font-semibold text-slate-700">{{ selectedLog.tablo_adi }}</code>
            </div>
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-sm text-slate-500">İşlem Tipi</span>
              <span class="font-medium text-slate-800">{{ selectedLog.islem_tipi }}</span>
            </div>
          </div>
          <div class="space-y-4">
             <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-sm text-slate-500">Kullanıcı</span>
              <div class="text-right">
                <div class="font-medium text-slate-800">{{ selectedLog.kullanici_adi || 'Sistem' }}</div>
                <div v-if="getIpAddress(selectedLog)" class="text-xs text-slate-400 font-mono">{{ getIpAddress(selectedLog) }}</div>
              </div>
            </div>
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-sm text-slate-500">Zaman</span>
              <span class="font-medium text-slate-800">{{ new Date(selectedLog.islem_zamani).toLocaleString('tr-TR') }}</span>
            </div>
          </div>
        </div>

        <!-- Smart Diff View -->
        <div v-if="selectedLog.islem_tipi === 'UPDATE'" class="mb-8">
          <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <GitCompare :size="20" class="text-indigo-600" />
            Değişiklikler
          </h3>
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3">Alan</th>
                  <th class="px-4 py-3 text-red-600">Eski Değer</th>
                  <th class="px-4 py-3 text-green-600">Yeni Değer</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="(diff, field) in getDiff(selectedLog)" :key="field" class="hover:bg-slate-50/50">
                  <td class="px-4 py-3 font-mono text-slate-600">{{ field }}</td>
                  <td class="px-4 py-3 text-red-700 bg-red-50/30">{{ diff.old }}</td>
                  <td class="px-4 py-3 text-green-700 bg-green-50/30 font-medium">{{ diff.new }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="Object.keys(getDiff(selectedLog)).length === 0" class="p-4 text-center text-slate-500 italic">
              Değişiklik tespit edilemedi veya veri yapısı uygun değil.
            </div>
          </div>
        </div>

        <!-- Raw Data Comparison -->
        <div>
          <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Code :size="20" class="text-slate-400" />
            Ham Veri
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-red-600 uppercase tracking-wider">Eski Veri</span>
              </div>
              <div class="bg-slate-900 rounded-xl p-4 overflow-auto max-h-60 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <pre class="text-xs font-mono text-red-300">{{ formatJson(selectedLog.eski_deger) }}</pre>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-green-600 uppercase tracking-wider">Yeni Veri</span>
              </div>
              <div class="bg-slate-900 rounded-xl p-4 overflow-auto max-h-60 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <pre class="text-xs font-mono text-green-300">{{ formatJson(selectedLog.yeni_deger) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  Activity, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Edit2, 
  Trash2, 
  LogIn,
  Globe,
  FileText,
  GitCompare,
  Code
} from 'lucide-vue-next';

definePageMeta({
  middleware: 'admin',
});

const { apiFetch } = useApi();

const logs = ref([]);
const loading = ref(true);
const showDetailModal = ref(false);
const selectedLog = ref(null);

// Pagination
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);
const limit = 50;

onMounted(() => {
  fetchLogs();
});

const fetchLogs = async () => {
  loading.value = true;
  try {
    const response = await apiFetch(`/logs?page=${currentPage.value}&limit=${limit}`);
    logs.value = response.data;
    if (response.pagination) {
      totalPages.value = response.pagination.totalPages;
      totalCount.value = response.pagination.totalCount;
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchLogs();
};

const viewLogDetail = (log) => {
  selectedLog.value = log;
  showDetailModal.value = true;
};

const formatJson = (data) => {
  if (!data) return 'null';
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return String(data);
  }
};

const getIpAddress = (log) => {
  if (log.yeni_deger && log.yeni_deger.ip) {
    return log.yeni_deger.ip;
  }
  return null;
};

const getChangeSummary = (log) => {
  if (log.islem_tipi === 'LOGIN') return 'Kullanıcı girişi';
  if (log.islem_tipi === 'INSERT') return 'Yeni kayıt oluşturuldu';
  if (log.islem_tipi === 'DELETE') return 'Kayıt silindi';
  
  if (log.islem_tipi === 'UPDATE') {
    const diff = getDiff(log);
    const keys = Object.keys(diff);
    if (keys.length === 0) return 'Değişiklik yok';
    
    // Special handling for stock changes
    if (keys.includes('stok_miktari') || keys.includes('toplam_stok')) {
       const key = keys.includes('stok_miktari') ? 'stok_miktari' : 'toplam_stok';
       return `Stok: ${diff[key].old} ➝ ${diff[key].new}`;
    }

    if (keys.length === 1) {
      return `${keys[0]} değiştirildi`;
    }
    return `${keys.length} alan değiştirildi`;
  }
  
  return '-';
};

const getDiff = (log) => {
  if (!log.eski_deger || !log.yeni_deger) return {};
  
  const diff = {};
  const oldData = log.eski_deger;
  const newData = log.yeni_deger;
  
  // Compare keys present in both or either
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  
  for (const key of allKeys) {
    // Skip internal fields like updated_at
    if (['updated_at', 'guncellenme_tarihi'].includes(key)) continue;

    const oldVal = oldData[key];
    const newVal = newData[key];
    
    // Simple equality check (can be improved for objects/arrays if needed)
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = {
        old: oldVal === undefined ? '(yok)' : oldVal,
        new: newVal === undefined ? '(silindi)' : newVal
      };
    }
  }
  
  return diff;
};
</script>
