<template>
  <div>
    <!-- Modern Tabs -->
    <div class="mb-8">
      <div class="flex space-x-2 bg-white/50 backdrop-blur-md rounded-2xl p-1.5 border border-white/40 shadow-sm w-fit">
        <button
          @click="activeTab = 'list'"
          class="px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2"
          :class="activeTab === 'list' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'"
        >
          <List :size="18" />
          Siparişler
        </button>
        <button
          @click="activeTab = 'create'"
          class="px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2"
          :class="activeTab === 'create' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'"
        >
          <PlusCircle :size="18" />
          Yeni İş Oluştur
        </button>
      </div>
    </div>

    <!-- List Tab -->
    <div v-if="activeTab === 'list'" class="animate-fade-in">
      <div v-if="loadingJobs" class="py-12 flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="activeJobs && activeJobs.length > 0" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div
          v-for="job in activeJobs"
          :key="job.id"
          class="glass-card p-5 hover:border-primary-200 transition-all duration-200 group"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="badge flex items-center gap-1.5 px-2.5 py-1"
                  :class="job.islem_tipi === 'Satış' ? 'badge-success' : 'badge-info'"
                >
                  <ShoppingCart v-if="job.islem_tipi === 'Satış'" :size="12" />
                  <Truck v-else :size="12" />
                  {{ job.islem_tipi }}
                </span>
                <span class="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar :size="12" />
                  {{ formatDateTime(job.tarih) }}
                </span>
              </div>
              
              <h3 class="text-lg font-bold text-slate-800 truncate" :title="job.taraf_adi">
                {{ job.taraf_adi }}
              </h3>

              <!-- Items List -->
              <div class="mt-3 space-y-1">
                <div v-for="(item, idx) in job.items" :key="idx" class="text-sm text-slate-600 flex justify-between border-b border-slate-100 last:border-0 pb-1 last:pb-0">
                    <span>{{ item.miktar }} x {{ item.urun_adi }}</span>
                    <span class="font-medium">{{ item.toplam?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) }} ₺</span>
                </div>
              </div>
            </div>

            <button
              @click="completeJob(job)"
              class="btn btn-sm btn-success shadow-none bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border-transparent"
              title="İşi Tamamla"
            >
              <CheckCircle :size="18" />
              <span class="hidden sm:inline ml-2">Tamamla</span>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16 bg-white/50 rounded-3xl border border-dashed border-slate-200">
        <Briefcase :size="48" class="mx-auto text-slate-300 mb-3" />
        <h3 class="text-lg font-medium text-slate-900">Aktif iş bulunamadı</h3>
        <p class="text-slate-500">Yeni bir iş oluşturarak başlayın.</p>
      </div>
    </div>

    <!-- Create Tab -->
    <div v-if="activeTab === 'create'" class="space-y-6 animate-fade-in">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Job Details Form -->
        <div class="lg:col-span-1 space-y-6">
          <div class="glass-card p-6">
            <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
                <FileText :size="20" />
              </div>
              İş Bilgileri
            </h2>

            <div class="space-y-4">
              <div class="space-y-1.5">
                <label class="label">İşlem Tipi</label>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    @click="newJob.islem_tipi = 'Alış'"
                    class="flex items-center justify-center gap-2 p-3 rounded-xl border transition-all"
                    :class="newJob.islem_tipi === 'Alış' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'"
                  >
                    <Truck :size="18" />
                    Alış
                  </button>
                  <button
                    type="button"
                    @click="newJob.islem_tipi = 'Satış'"
                    class="flex items-center justify-center gap-2 p-3 rounded-xl border transition-all"
                    :class="newJob.islem_tipi === 'Satış' ? 'bg-green-50 border-green-200 text-green-700 ring-1 ring-green-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'"
                  >
                    <ShoppingCart :size="18" />
                    Satış
                  </button>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="label flex justify-between">
                  Taraf
                  <button
                    v-if="newJob.islem_tipi"
                    @click="showPartyModal = true"
                    class="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1"
                  >
                    <PlusCircle :size="12" />
                    Yeni Ekle
                  </button>
                </label>
                <select v-model="newJob.taraf_id" class="input" :disabled="!newJob.islem_tipi">
                  <option value="">{{ newJob.islem_tipi ? 'Seçiniz' : 'Önce İşlem Tipi Seçin' }}</option>
                  <option v-for="party in parties" :key="party.id" :value="party.id">
                    {{ party.musteri_adi || party.tedarikci_adi }}
                  </option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="label">Tarih</label>
                <input v-model="newJob.tarih" type="date" class="input" />
              </div>
            </div>
          </div>

          <!-- Summary Card (Mobile/Desktop) -->
          <div class="glass-card p-6 bg-slate-900 text-white border-slate-800">
            <h3 class="text-sm font-medium text-slate-400 mb-4">Özet</h3>
            <div class="flex justify-between items-end mb-6">
              <div>
                <p class="text-3xl font-bold">{{ grandTotal.toFixed(2) }} <span class="text-lg font-normal text-slate-400">₺</span></p>
                <p class="text-sm text-slate-400 mt-1">{{ productRows.length }} Kalem Ürün</p>
              </div>
            </div>
            <button
              @click="createJob"
              :disabled="!canCreateJob || creatingJob"
              class="w-full btn bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save :size="18" class="mr-2" />
              {{ creatingJob ? 'Oluşturuluyor...' : 'İşi Kaydet' }}
            </button>
          </div>
        </div>

        <!-- Products List -->
        <div class="lg:col-span-2">
          <div class="glass-card p-6 min-h-full">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <RefreshCw :size="32" />
          </div>
          <h1 class="text-3xl font-bold text-slate-800">Siparişler</h1>
        </div>
              <button
                @click="addProductRow"
                :disabled="!newJob.islem_tipi"
                class="btn btn-sm btn-secondary text-xs"
              >
                <PlusCircle :size="16" class="mr-1.5" />
                Satır Ekle
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(product, index) in productRows"
                :key="product._id"
                class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                <div class="grid grid-cols-12 gap-4 items-end">
                  <div class="col-span-12 md:col-span-5">
                    <label class="label text-xs">Ürün</label>
                    <select v-model="product.urun_id" class="input py-2 text-sm" required>
                      <option :value="null">Seçiniz</option>
                      <option v-for="urun in availableProducts" :key="urun.id" :value="urun.id">
                        {{ urun.urun_adi }}
                      </option>
                    </select>
                  </div>

                  <div class="col-span-6 md:col-span-2">
                    <label class="label text-xs">Miktar</label>
                    <input
                      v-model.number="product.miktar"
                      type="number"
                      min="1"
                      class="input py-2 text-sm"
                      placeholder="Adet"
                    />
                  </div>

                  <div class="col-span-6 md:col-span-3">
                    <label class="label text-xs">Birim Fiyat</label>
                    <div class="relative">
                      <input
                        v-model.number="product.birim_fiyat"
                        type="number"
                        min="0"
                        step="0.01"
                        class="input py-2 text-sm pl-8"
                        placeholder="0.00"
                      />
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₺</span>
                    </div>
                  </div>

                  <div class="col-span-12 md:col-span-2 flex justify-end">
                    <button
                      @click="removeProductRow(index)"
                      class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 :size="18" />
                    </button>
                  </div>
                </div>
                
                <div v-if="product.miktar && product.birim_fiyat" class="mt-2 text-right">
                   <span class="text-xs font-medium text-slate-500">Ara Toplam: </span>
                   <span class="text-sm font-bold text-slate-800">{{ (product.miktar * product.birim_fiyat).toFixed(2) }} ₺</span>
                </div>
              </div>

              <div v-if="productRows.length === 0" class="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <p class="text-slate-500 text-sm">Henüz ürün eklenmedi.</p>
                <button @click="addProductRow" :disabled="!newJob.islem_tipi" class="text-primary-600 text-sm font-medium hover:underline mt-1">
                  İlk ürünü ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Survey Modal -->
    <div v-if="showSurveyModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-scale-in">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star :size="32" class="text-yellow-500" />
          </div>
          <h2 class="text-2xl font-bold text-slate-800">Memnuniyet Anketi</h2>
          <p class="text-slate-500 mt-2">Lütfen tamamlanan işi değerlendirin</p>
        </div>

        <div class="space-y-8">
          <div class="space-y-3">
            <label class="block text-sm font-medium text-slate-700 text-center">Teslimat Hızı</label>
            <div class="flex justify-center gap-2">
              <button
                v-for="star in 5"
                :key="`delivery-${star}`"
                @click="survey.teslimat_hizi = star"
                class="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  :size="32"
                  :class="star <= survey.teslimat_hizi ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'"
                />
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <label class="block text-sm font-medium text-slate-700 text-center">Eksiksiz Teslimat</label>
            <div class="flex justify-center gap-2">
              <button
                v-for="star in 5"
                :key="`complete-${star}`"
                @click="survey.eksiksiz_teslimat = star"
                class="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  :size="32"
                  :class="star <= survey.eksiksiz_teslimat ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'"
                />
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <label class="block text-sm font-medium text-slate-700 text-center">Fiyat/Performans</label>
            <div class="flex justify-center gap-2">
              <button
                v-for="star in 5"
                :key="`price-${star}`"
                @click="survey.fiyat_performans = star"
                class="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  :size="32"
                  :class="star <= survey.fiyat_performans ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'"
                />
              </button>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-10">
          <button @click="closeSurveyModal" class="btn btn-secondary flex-1">
            İptal
          </button>
          <button
            @click="submitSurvey"
            :disabled="!survey.teslimat_hizi || !survey.eksiksiz_teslimat || !survey.fiyat_performans || submittingSurvey"
            class="btn btn-primary flex-1"
          >
            {{ submittingSurvey ? 'Gönderiliyor...' : 'Tamamla' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Customer/Supplier Creation Modal -->
    <div v-if="showPartyModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        <h2 class="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <UserPlus :size="24" class="text-primary-600" />
          Yeni {{ newJob.islem_tipi === 'Satış' ? 'Müşteri' : 'Tedarikçi' }} Ekle
        </h2>

        <div class="space-y-4">
          <div>
            <label class="label">
              {{ newJob.islem_tipi === 'Satış' ? 'Müşteri' : 'Tedarikçi' }} Adı *
            </label>
            <input
              v-model="newParty.name"
              type="text"
              class="input"
              :placeholder="`${newJob.islem_tipi === 'Satış' ? 'Müşteri' : 'Tedarikçi'} adını giriniz`"
            />
          </div>

          <div>
            <label class="label">İletişim No</label>
            <input
              v-model="newParty.contact"
              type="text"
              class="input"
              placeholder="Telefon numarası (isteğe bağlı)"
            />
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button @click="closePartyModal" class="btn btn-secondary flex-1">
            İptal
          </button>
          <button
            @click="createParty"
            :disabled="!newParty.name || creatingParty"
            class="btn btn-primary flex-1"
          >
            {{ creatingParty ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Briefcase,
  List,
  PlusCircle,
  ShoppingCart,
  Truck,
  Calendar,
  CheckCircle,
  FileText,
  UserPlus,
  Star,
  Send,
  X,
  Save,
  Trash2
} from 'lucide-vue-next';

definePageMeta({
  middleware: 'auth',
});

const { apiFetch } = useApi();

const activeTab = ref('list');
const activeJobs = ref([]);
const loadingJobs = ref(true);
const parties = ref([]);

const newJob = ref({
  islem_tipi: '',
  taraf_id: '',
  tarih: '',
});

const productRows = ref([]);
const availableProducts = ref([]);

const creatingJob = ref(false);

const showSurveyModal = ref(false);
const selectedJobForCompletion = ref(null);
const survey = ref({
  teslimat_hizi: 0,
  eksiksiz_teslimat: 0,
  fiyat_performans: 0,
});
const submittingSurvey = ref(false);

const showPartyModal = ref(false);
const newParty = ref({
  name: '',
  contact: '',
});
const creatingParty = ref(false);

// Computed
const grandTotal = computed(() => {
  return productRows.value.reduce((sum, product) => {
    return sum + (product.miktar || 0) * (product.birim_fiyat || 0);
  }, 0);
});

const canCreateJob = computed(() => {
  return (
    newJob.value.islem_tipi &&
    newJob.value.taraf_id &&
    newJob.value.tarih &&
    productRows.value.length > 0 &&
    productRows.value.every(p => p.urun_id && p.miktar > 0 && p.birim_fiyat >= 0)
  );
});

// Lifecycle
onMounted(async () => {
  await fetchActiveJobs();
  await fetchProducts();
});

watch(() => newJob.value.islem_tipi, async (newType) => {
  if (newType) {
    await fetchParties(newType);
    // productRows.value = []; // Disabled auto-reset to prevent data loss
  }
});

const fetchActiveJobs = async () => {
  try {
    const response = await apiFetch('/jobs/active');
    activeJobs.value = response.data;
  } catch (error) {
    console.error('Error fetching active jobs:', error);
  } finally {
    loadingJobs.value = false;
  }
};

const fetchParties = async (islem_tipi) => {
  try {
    const endpoint = islem_tipi === 'Satış' ? '/jobs/parties/customers' : '/jobs/parties/suppliers';
    const response = await apiFetch(endpoint);
    parties.value = response.data;
  } catch (error) {
    console.error('Error fetching parties:', error);
  }
};

const fetchProducts = async () => {
  try {
    const response = await apiFetch('/products?limit=1000');
    availableProducts.value = response.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
  }
};

const addProductRow = () => {
  productRows.value.push({
    _id: Date.now() + Math.random(), // Unique ID for Vue key
    urun_id: null,
    miktar: 1,
    birim_fiyat: 0,
  });
};

const removeProductRow = (index) => {
  productRows.value.splice(index, 1);
};

const createJob = async () => {
  creatingJob.value = true;
  try {
    const response = await apiFetch('/jobs', {
      method: 'POST',
      body: {
        islem_tipi: newJob.value.islem_tipi,
        taraf_id: newJob.value.taraf_id,
        tarih: `${newJob.value.tarih}T${new Date().toLocaleTimeString('tr-TR', { hour12: false })}`,
        urunler: productRows.value,
      },
    });
    console.log('Sending Job Payload:', {
        islem_tipi: newJob.value.islem_tipi,
        taraf_id: newJob.value.taraf_id,
        tarih: newJob.value.tarih,
        urunler: productRows.value,
    });

    if (response.success) {
      alert(`✅ İş başarıyla oluşturuldu! (${response.data.length} ürün)`);
      // Reset form
      newJob.value = { islem_tipi: '', taraf_id: '', tarih: '' };
      productRows.value = [];
      activeTab.value = 'list';
      await fetchActiveJobs();
    }
  } catch (error) {
    console.error('Error creating job:', error);
    alert('❌ İş oluşturulamadı: ' + (error.message || 'Bilinmeyen hata'));
  } finally {
    creatingJob.value = false;
  }
};

const completeJob = async (job) => {
  if (job.islem_tipi === 'Satış') {
    // Directly complete without survey
    if (!confirm('Bu satış işlemini tamamlamak istediğinize emin misiniz?')) return;
    
    selectedJobForCompletion.value = job;
    await submitCompletion(job, null);
  } else {
    // Show survey for Alış
    selectedJobForCompletion.value = job;
    showSurveyModal.value = true;
  }
};

const closeSurveyModal = () => {
  showSurveyModal.value = false;
  selectedJobForCompletion.value = null;
  survey.value = {
    teslimat_hizi: 0,
    eksiksiz_teslimat: 0,
    fiyat_performans: 0,
  };
};

const submitSurvey = () => {
  submitCompletion(selectedJobForCompletion.value, survey.value);
};

const submitCompletion = async (job, surveyData) => {
  submittingSurvey.value = true;
  try {
    const response = await apiFetch(`/jobs/${job.id}/complete`, {
      method: 'POST',
      body: {
        islem_tipi: job.islem_tipi,
        survey: surveyData,
      },
    });

    if (response.success) {
      if (job.islem_tipi === 'Alış') {
          alert(`İş başarıyla tamamlandı! Ortalama Memnuniyet Skoru: ${response.averageScore.toFixed(2)}/5`);
      } else {
          alert('İş başarıyla tamamlandı!');
      }
      
      closeSurveyModal();
      await fetchActiveJobs();
    }
  } catch (error) {
    alert('İş tamamlanırken hata oluştu: ' + (error.data?.error || 'Bilinmeyen hata'));
  } finally {
    submittingSurvey.value = false;
  }
};

const closePartyModal = () => {
  showPartyModal.value = false;
  newParty.value = {
    name: '',
    contact: '',
  };
};

const createParty = async () => {
  creatingParty.value = true;
  try {
    const endpoint = newJob.value.islem_tipi === 'Satış' ? '/jobs/parties/customers' : '/jobs/parties/suppliers';
    const fieldName = newJob.value.islem_tipi === 'Satış' ? 'musteri_adi' : 'tedarikci_adi';
    const contactField = newJob.value.islem_tipi === 'Satış' ? 'musteri_iletisim_no' : 'tedarikci_iletisim_no';
    
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: {
        [fieldName]: newParty.value.name,
        [contactField]: newParty.value.contact,
      },
    });

    if (response.success) {
      alert(`${newJob.value.islem_tipi === 'Satış' ? 'Müşteri' : 'Tedarikçi'} başarıyla eklendi!`);
      closePartyModal();
      await fetchParties(newJob.value.islem_tipi);
      
      // Auto-select the new party
      if (response.data && response.data.id) {
          newJob.value.taraf_id = response.data.id;
      } else if (response.data && (response.data.musteri_id || response.data.tedarikci_id)) {
          newJob.value.taraf_id = response.data.musteri_id || response.data.tedarikci_id;
      }
    }
  } catch (error) {
    alert('Hata oluştu: ' + (error.data?.error || 'Bilinmeyen hata'));
  } finally {
    creatingParty.value = false;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(' ', ' - ');
};
</script>
