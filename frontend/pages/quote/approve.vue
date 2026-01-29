<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Header -->
    <div class="bg-blue-600 text-white p-4 shadow-md text-center">
      <h1 class="text-2xl font-bold">Doğu AŞ Teklif Onayı</h1>
      <p class="text-sm opacity-90">Lütfen aşağıdaki teklif dosyasını inceleyip kararınızı veriniz.</p>
    </div>

    <!-- Main Content -->
    <div class="flex-grow p-4 flex justify-center items-center">
      
      <!-- Loading State -->
      <div v-if="loading" class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Teklif yükleniyor...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
        <div class="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 class="text-xl font-bold text-gray-800 mb-2">Bir Hata Oluştu</h2>
        <p class="text-gray-600">{{ error }}</p>
      </div>

      <!-- Success State (Approved) -->
      <div v-else-if="success && decision === 'approve'" class="bg-white p-12 rounded-lg shadow-lg max-w-lg text-center">
        <div class="text-green-500 text-6xl mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Teşekkür Ederiz</h2>
        <p class="text-gray-600 text-lg">Teklif onaylandı, siparişiniz en kısa sürede hazırlanacaktır.</p>
        <p class="text-gray-500 mt-4">Bizi tercih ettiğiniz için teşekkür ederiz.</p>
      </div>

      <!-- Success State (Rejected) -->
      <div v-else-if="success && decision === 'reject'" class="bg-white p-12 rounded-lg shadow-lg max-w-lg text-center">
        <div class="text-gray-500 text-6xl mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Geri Bildiriminiz Alındı</h2>
        <p class="text-gray-600 text-lg">Teklifimizi reddettiniz. Doğu AŞ olarak, sizin için daha uygun çözümleri değerlendirmek üzere en kısa sürede sizinle iletişime geçeceğiz.</p>
        <p class="text-gray-500 mt-4">İlginiz için teşekkür ederiz.</p>
      </div>

      <!-- Already Responded State -->
      <div v-else-if="quote && quote.durum !== 'BEKLEMEDE'" class="bg-white p-12 rounded-lg shadow-lg max-w-lg text-center">
        <div class="text-blue-500 text-6xl mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Teklif Zaten Yanıtlandı</h2>
        <p class="text-gray-600 text-lg">Bu teklif için daha önce <strong>{{ quote.durum === 'ONAYLANDI' ? 'ONAY' : 'RET' }}</strong> kararı verilmiştir.</p>
        <p class="text-gray-500 mt-4">Bir hata olduğunu düşünüyorsanız lütfen bizimle iletişime geçiniz.</p>
      </div>

      <!-- Quote View -->
      <div v-else class="bg-white w-full max-w-5xl h-[80vh] rounded-lg shadow-lg flex flex-col overflow-hidden relative">
        <!-- PDF Viewer -->
        <!-- PDF Viewer -->
        <div class="flex-grow bg-gray-200 relative overflow-y-auto p-4">
          <client-only>
            <vue-pdf-embed 
              v-if="pdfUrl" 
              :source="pdfUrl" 
              class="w-full shadow-md"
            />
            <div v-else class="flex items-center justify-center h-full text-gray-500">
              PDF yükleniyor veya bulunamadı...
            </div>
          </client-only>
          
          <!-- Fallback Download Button -->
          <div v-if="pdfUrl" class="absolute top-4 right-4 z-10">
             <a :href="pdfUrl" target="_blank" :download="(quote.proje_adi || 'Teklif') + '.pdf'" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               İndir
             </a>
          </div>
        </div>

        <!-- Action Bar -->
        <div class="bg-white p-4 border-t border-gray-200 flex justify-between items-center">
          <div>
            <h3 class="font-bold text-gray-800">{{ quote.proje_adi || 'Proje Detayı' }}</h3>
            <p class="text-sm text-gray-600">Toplam Tutar: <span class="font-bold text-blue-600">{{ formatCurrency(quote.toplam_tutar) }}</span></p>
          </div>
          <div class="space-x-4">
            <button 
              @click="openRejectModal" 
              class="px-6 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors font-medium"
            >
              Reddet
            </button>
            <button 
              @click="handleDecision('approve')" 
              class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium shadow-md"
            >
              Teklifi Onayla
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Reason Modal -->
    <div v-if="showRejectModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Teklifi Reddetme Sebebi</h3>
        <p class="text-gray-600 mb-4 text-sm">Lütfen teklifi reddetme sebebinizi kısaca belirtiniz. Bu geri bildirim size daha iyi hizmet verebilmemiz için önemlidir.</p>
        
        <textarea 
          v-model="rejectReason" 
          class="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-32"
          placeholder="Sebep belirtiniz..."
        ></textarea>

        <div class="flex justify-end space-x-3 mt-6">
          <button 
            @click="showRejectModal = false" 
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            İptal
          </button>
          <button 
            @click="submitRejection" 
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-sm"
            :disabled="!rejectReason.trim()"
          >
            Reddet ve Gönder
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { AlertCircle, CheckCircle } from 'lucide-vue-next';
import VuePdfEmbed from 'vue-pdf-embed';

// Essential styles for vue-pdf-embed (usually not needed if using tailwind, but good safety)
// import 'vue-pdf-embed/dist/style/index.css' 

definePageMeta({
  layout: false,
  auth: false
});

const route = useRoute();
const config = useRuntimeConfig();

const loading = ref(true);
const processing = ref(false);
const error = ref(null);
const success = ref(false);
const quote = ref(null);
const pdfUrl = ref(null);
const decision = ref('');

// Modal State
const showRejectModal = ref(false);
const rejectReason = ref('');

const formatCurrency = (value) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
};

onMounted(async () => {
  const token = route.query.token;
  if (!token) {
    error.value = 'Geçersiz bağlantı.';
    loading.value = false;
    return;
  }

  try {
    const res = await fetch(`https://doguaspanel.ch/api/quotes/public/${token}`);
    const data = await res.json();

    if (data.success) {
      quote.value = data.data;
      
      let path = data.data.dosya_yolu || '';
      path = path.replace(/\\/g, '/');
      const filename = path.split('/').pop();
      
      if (filename) {
          pdfUrl.value = `https://doguaspanel.ch/uploads/${filename}#view=FitH`;
      }
      
    } else {
      error.value = data.error || 'Teklif bulunamadı.';
    }
  } catch (e) {
    error.value = 'Sunucu hatası.';
  } finally {
    loading.value = false;
  }
});

const openRejectModal = () => {
  showRejectModal.value = true;
};

const submitRejection = () => {
  handleDecision('reject', rejectReason.value);
  showRejectModal.value = false;
};

const handleDecision = async (dec, reason = null) => {
  processing.value = true;
  decision.value = dec;
  const token = route.query.token;

  try {
    const res = await fetch(`https://doguaspanel.ch/api/quotes/public/${token}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: dec, reason: reason })
    });
    const data = await res.json();

    if (data.success) {
      success.value = true;
    } else {
      error.value = data.error || 'İşlem başarısız.';
    }
  } catch (e) {
    error.value = 'Sunucu hatası.';
  } finally {
    processing.value = false;
  }
};
</script>
