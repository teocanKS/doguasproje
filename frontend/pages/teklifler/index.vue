<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800 flex items-center gap-3">
        <div class="p-2 bg-purple-50 rounded-xl text-purple-600">
          <FileText :size="32" />
        </div>
        Teklifler
      </h1>
      <NuxtLink to="/teklifler/yukle" class="btn btn-primary flex items-center gap-2">
        <Upload :size="20" />
        Yeni Teklif Yükle
      </NuxtLink>
    </div>

    <div class="glass-card p-6">
      <div v-if="loading" class="py-12 flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="quotes && quotes.length > 0">
        <!-- Desktop Table View -->
        <div class="hidden md:block table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Teklif No</th>
                <th>Müşteri</th>
                <th>Proje</th>
                <th>Tarih</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="quote in quotes" :key="quote.teklif_id" class="hover:bg-slate-50 transition-colors">
                <td class="font-medium text-slate-900">#{{ quote.teklif_id }}</td>
                <td class="font-medium text-slate-700">{{ quote.musteri_adi }}</td>
                <td class="text-slate-600">{{ quote.proje_adi || '-' }}</td>
                <td class="text-slate-600">{{ formatDate(quote.teklif_tarihi) }}</td>
                <td class="font-bold text-slate-800">{{ formatCurrency(quote.toplam_tutar) }}</td>
                <td>
                  <span class="badge" :class="getStatusClass(quote.durum)">
                    {{ quote.durum }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <NuxtLink :to="`/teklifler/${quote.teklif_id}`" class="btn btn-sm btn-secondary">
                      Detay
                    </NuxtLink>
                    <button
                      v-if="quote.durum === 'BEKLEMEDE'"
                      @click="rejectQuote(quote.teklif_id)"
                      class="btn btn-sm btn-danger"
                    >
                      Reddet
                    </button>
                    <button
                      @click="deleteQuote(quote.teklif_id)"
                      class="btn btn-sm btn-danger bg-red-100 text-red-600 hover:bg-red-200 border-none"
                      title="Sil"
                    >
                      <Trash2 :size="16" />
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
            v-for="quote in quotes" 
            :key="quote.teklif_id"
            class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
          >
            <div class="flex justify-between items-start mb-4">
              <div>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Teklif #{{ quote.teklif_id }}</span>
                <h3 class="font-bold text-lg text-slate-900 mt-1">{{ quote.musteri_adi }}</h3>
                <p class="text-sm text-slate-500" v-if="quote.proje_adi">{{ quote.proje_adi }}</p>
              </div>
              <span class="badge" :class="getStatusClass(quote.durum)">
                {{ quote.durum }}
              </span>
            </div>

            <div class="flex justify-between items-end border-t border-slate-100 pt-4 mb-4">
              <div>
                <div class="text-xs text-slate-500 mb-1">Tarih</div>
                <div class="font-medium text-slate-700">{{ formatDate(quote.teklif_tarihi) }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-slate-500 mb-1">Toplam Tutar</div>
                <div class="text-xl font-bold text-slate-900">{{ formatCurrency(quote.toplam_tutar) }}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <NuxtLink 
                :to="`/teklifler/${quote.teklif_id}`" 
                class="btn btn-secondary w-full justify-center"
              >
                <Eye :size="18" class="mr-2" />
                Detay
              </NuxtLink>
              
              <div class="flex gap-2">
                <button
                  v-if="quote.durum === 'BEKLEMEDE'"
                  @click="rejectQuote(quote.teklif_id)"
                  class="btn btn-danger w-full justify-center"
                >
                  Reddet
                </button>
                <button
                  @click="deleteQuote(quote.teklif_id)"
                  class="btn btn-danger bg-red-100 text-red-600 hover:bg-red-200 border-none w-full justify-center"
                >
                  <Trash2 :size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div class="flex justify-between items-center mt-6 px-2">
          <div class="text-sm text-slate-500">
            Sayfa {{ currentPage }} / {{ totalPages }}
          </div>
          <div class="flex gap-2">
            <button 
              @click="changePage(currentPage - 1)" 
              :disabled="currentPage === 1"
              class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            <button 
              @click="changePage(currentPage + 1)" 
              :disabled="currentPage === totalPages"
              class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <FileText :size="48" class="mx-auto text-slate-300 mb-3" />
        <h3 class="text-lg font-medium text-slate-900">Henüz teklif yüklenmemiş</h3>
        <p class="text-slate-500 mb-4">Excel dosyasından yeni bir teklif yükleyerek başlayın.</p>
        <NuxtLink to="/teklifler/yukle" class="btn btn-primary">
          Teklif Yükle
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { FileText, Upload, Eye, Trash2 } from 'lucide-vue-next';

definePageMeta({
  middleware: 'auth',
});

const { apiFetch } = useApi();
const quotes = ref([]);
const loading = ref(true);

// Pagination State
const currentPage = ref(1);
const totalPages = ref(1);
const limit = 20;

const rejectQuote = async (id) => {
  if (!confirm('Bu teklifi reddetmek istediğinize emin misiniz?')) return;

  try {
    const res = await apiFetch(`/quotes/${id}/reject`, { method: 'POST' });
    if (res.success) {
      // Refresh list
      const index = quotes.value.findIndex(q => q.teklif_id === id);
      if (index !== -1) {
        quotes.value[index].durum = 'REDDEDILDI';
      }
    }
  } catch (error) {
    console.error('Reject error:', error);
    alert('Teklif reddedilirken hata oluştu.');
  }
};

const deleteQuote = async (id) => {
  if (!confirm('Bu teklifi tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;

  try {
    const res = await apiFetch(`/quotes/${id}`, { method: 'DELETE' });
    if (res.success) {
      // Remove from list
      quotes.value = quotes.value.filter(q => q.teklif_id !== id);
      // If page becomes empty, go back one page
      if (quotes.value.length === 0 && currentPage.value > 1) {
        changePage(currentPage.value - 1);
      } else {
        fetchQuotes(); // Refresh to get correct pagination
      }
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('Teklif silinirken hata oluştu.');
  }
};

onMounted(() => {
  fetchQuotes();
});

const fetchQuotes = async () => {
  loading.value = true;
  try {
    const response = await apiFetch(`/quotes?page=${currentPage.value}&limit=${limit}`);
    quotes.value = response.data;
    if (response.pagination) {
      currentPage.value = response.pagination.currentPage;
      totalPages.value = response.pagination.totalPages;
    }
  } catch (error) {
    console.error('Error fetching quotes:', error);
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchQuotes();
  }
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('tr-TR');
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
};

const getStatusClass = (status) => {
  switch (status) {
    case 'ONAYLANDI': return 'badge-success';
    case 'REDDEDILDI': return 'badge-danger';
    default: return 'badge-warning';
  }
};
</script>
