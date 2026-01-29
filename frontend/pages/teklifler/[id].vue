<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-4">
        <NuxtLink to="/teklifler" class="btn btn-secondary p-2">
          <ArrowLeft :size="20" />
        </NuxtLink>
        <h1 class="text-3xl font-bold text-slate-800 flex items-center gap-3">
          Teklif Detayı <span class="text-slate-400 text-xl font-normal">#{{ route.params.id }}</span>
        </h1>
      </div>
      
      <div class="flex gap-3">
        <button 
          v-if="quote?.durum === 'BEKLEMEDE'"
          @click="approveQuote" 
          class="btn btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 border-green-600"
          :disabled="processing"
        >
          <CheckCircle :size="20" />
          <span v-if="processing">İşleniyor...</span>
          <span v-else>Siparişe Dönüştür</span>
        </button>
        <div v-else-if="quote?.durum === 'ONAYLANDI'" class="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-lg border border-green-200">
          <CheckCircle :size="20" />
          Sipariş Oluşturuldu
        </div>
      </div>
    </div>

    <div v-if="loading" class="py-12 flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="quote" class="space-y-6">
      <!-- Metadata Card -->
      <div class="glass-card p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Müşteri</label>
            <p class="text-lg font-medium text-slate-900 mt-1">{{ quote.musteri_adi }}</p>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proje</label>
            <p class="text-lg font-medium text-slate-900 mt-1">{{ quote.proje_adi || '-' }}</p>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teklif Tarihi</label>
            <p class="text-lg font-medium text-slate-900 mt-1">{{ formatDate(quote.teklif_tarihi) }}</p>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Tutar</label>
            <p class="text-2xl font-bold text-primary-600 mt-1">{{ formatCurrency(quote.toplam_tutar) }}</p>
          </div>
        </div>
      </div>

      <!-- Rejection Reason Card -->
      <div v-if="quote.durum === 'REDDEDILDI'" class="glass-card p-6 bg-red-50 border border-red-100">
        <h3 class="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
          <XCircle :size="24" />
          Teklif Reddedildi
        </h3>
        <div class="text-red-700">
          <span class="font-semibold">Red Sebebi:</span>
          <p class="mt-1">{{ quote.red_sebebi || 'Sebep belirtilmedi.' }}</p>
        </div>
      </div>

      <!-- Items Table -->
      <div class="glass-card p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-4">Teklif Kalemleri</h3>
        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Malzeme Cinsi</th>
                <th class="text-right">Miktar</th>
                <th>Birim</th>
                <th class="text-right">Birim Fiyat</th>
                <th class="text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in quote.items" :key="item.kalem_id">
                <td class="font-medium text-slate-800">{{ item.malzeme_cinsi }}</td>
                <td class="text-right font-mono">{{ item.miktar }}</td>
                <td class="text-slate-500">{{ item.birim }}</td>
                <td class="text-right font-mono text-slate-600">{{ formatCurrency(item.birim_fiyat) }}</td>
                <td class="text-right font-bold text-slate-800">{{ formatCurrency(item.toplam_fiyat) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-vue-next';

definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const { apiFetch } = useApi();
const quote = ref(null);
const loading = ref(true);
const processing = ref(false);

onMounted(() => {
  fetchQuote();
});

const fetchQuote = async () => {
  try {
    const response = await apiFetch(`/quotes/${route.params.id}`);
    quote.value = response.data;
  } catch (error) {
    console.error('Error fetching quote:', error);
    alert('Teklif detayları alınamadı.');
  } finally {
    loading.value = false;
  }
};

const approveQuote = async () => {
  if (!confirm('Bu teklifi onaylamak ve siparişe dönüştürmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
    return;
  }

  processing.value = true;
  try {
    const response = await apiFetch(`/quotes/${route.params.id}/approve`, {
      method: 'POST',
    });

    if (response.success) {
      alert('Teklif başarıyla onaylandı ve siparişler oluşturuldu!');
      await fetchQuote(); // Refresh data
    }
  } catch (error) {
    console.error('Approval error:', error);
    alert('Onay işlemi sırasında hata oluştu: ' + (error.data?.error || error.message));
  } finally {
    processing.value = false;
  }
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('tr-TR');
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
};
</script>
