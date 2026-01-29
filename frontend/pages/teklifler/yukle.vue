<template>
  <div class="h-[calc(100vh-6rem)] flex flex-col">
    <div class="mb-4 flex-none">
      <NuxtLink to="/teklifler" class="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-2">
        <ArrowLeft :size="20" />
        Tekliflere Dön
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-800">Yeni Teklif Oluştur</h1>
    </div>

    <div class="flex-1 flex gap-6 min-h-0">
      <!-- Left Side: Form -->
      <div class="w-1/2 flex flex-col gap-4 overflow-y-auto pr-2">
        
        <!-- Customer Selection -->
        <div class="glass-card p-6">
          <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <User :size="20" class="text-indigo-600" /> Müşteri Bilgileri
          </h3>
          
          <div class="space-y-4">
            <div class="relative">
              <label class="block text-sm font-medium text-slate-700 mb-1">Müşteri Seç / Ekle</label>
              <div class="relative">
                <input 
                  v-model="customerSearch" 
                  type="text" 
                  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Müşteri adı ara veya yeni yaz..."
                  @focus="showCustomerDropdown = true"
                  @input="filterCustomers"
                >
                <div v-if="showCustomerDropdown && (filteredCustomers.length > 0 || customerSearch)" class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div 
                    v-for="c in filteredCustomers" 
                    :key="c.musteri_id" 
                    class="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b last:border-0"
                    @click="selectCustomer(c)"
                  >
                    <div class="font-medium text-slate-800">{{ c.musteri_adi }}</div>
                    <div class="text-xs text-slate-500">{{ c.musteri_email || 'E-posta yok' }}</div>
                  </div>
                  <!-- Add New Customer Option -->
                  <div 
                    v-if="!filteredCustomers.find(c => c.musteri_adi.toLowerCase() === customerSearch.toLowerCase()) && customerSearch"
                    class="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-indigo-600 font-medium border-t"
                    @click="addNewCustomer"
                  >
                    + "{{ customerSearch }}" Ekle
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">İletişim Bilgisi</label>
              <input v-model="form.musteri_iletisim" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Telefon veya Adres">
            </div>

            <div class="relative">
              <label class="block text-sm font-medium text-slate-700 mb-1">Proje Adı</label>
              <div class="relative">
                <input 
                  v-model="projectSearch" 
                  type="text" 
                  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Proje adı ara veya yeni yaz..."
                  @focus="showProjectDropdown = true"
                  @input="filterProjects"
                  :disabled="!isCustomerSelectedOrNew"
                >
                 <div v-if="showProjectDropdown && filteredProjects.length > 0" class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div 
                    v-for="p in filteredProjects" 
                    :key="p.proje_adi" 
                    class="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b last:border-0"
                    @click="selectProject(p)"
                  >
                    <div class="font-medium text-slate-800">{{ p.proje_adi }}</div>
                  </div>
                </div>
              </div>
              <p v-if="!isCustomerSelectedOrNew" class="text-xs text-slate-500 mt-1">Proje seçmek için önce müşteri seçiniz veya ekleyiniz.</p>
            </div>
          </div>
        </div>

        <!-- Items Entry -->
        <div class="glass-card p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Package :size="20" class="text-indigo-600" /> Teklif Kalemleri
            </h3>
            <div class="flex gap-2">
              <button 
                v-if="selectedCustomerId" 
                type="button" 
                @click="fetchPreviousOrders" 
                class="btn btn-sm btn-outline-secondary flex items-center gap-2 text-xs"
                title="Bu müşterinin son onaylanan siparişindeki ürünleri getir"
              >
                <History :size="14" /> Önceki Sipariş
              </button>
              <button type="button" @click="addItem" class="btn btn-sm btn-secondary flex items-center gap-2">
                <Plus :size="16" /> Ekle
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <div v-for="(item, index) in form.items" :key="index" class="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div class="grid grid-cols-12 gap-3 mb-2">
                <div class="col-span-12 relative">
                  <!-- Product Autocomplete -->
                  <input 
                    v-model="item.malzeme_cinsi" 
                    type="text" 
                    class="w-full px-3 py-2 border rounded-md text-sm" 
                    placeholder="Ürün / Hizmet Adı Ara..."
                    @input="searchProducts(index)"
                    @focus="item.showDropdown = true"
                    @blur="setTimeout(() => item.showDropdown = false, 200)"
                  >
                  <div v-if="item.showDropdown && item.searchResults && item.searchResults.length > 0" class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div 
                      v-for="prod in item.searchResults" 
                      :key="prod.id" 
                      class="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b last:border-0"
                      @click="selectProduct(index, prod)"
                    >
                      <div class="font-medium text-slate-800">{{ prod.urun_adi }}</div>
                      <div class="text-xs text-slate-500">{{ prod.kategori }} - {{ prod.birim }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-12 gap-3">
                <div class="col-span-4">
                  <input v-model.number="item.miktar" type="number" min="1" class="w-full px-3 py-2 border rounded-md text-sm" placeholder="Miktar">
                </div>
                <div class="col-span-4">
                  <select v-model="item.birim" class="w-full px-3 py-2 border rounded-md text-sm">
                    <option>Adet</option>
                    <option>Kg</option>
                    <option>Ton</option>
                    <option>Metre</option>
                    <option>Saat</option>
                  </select>
                </div>
                <div class="col-span-4">
                  <input v-model.number="item.birim_fiyat" type="number" min="0" step="0.01" class="w-full px-3 py-2 border rounded-md text-sm" placeholder="Birim Fiyat">
                </div>
              </div>
              <div class="mt-2 flex justify-between items-center">
                <span class="text-sm font-medium text-slate-600">
                  Tutar: {{ formatCurrency(item.miktar * item.birim_fiyat) }}
                </span>
                <button type="button" @click="removeItem(index)" class="text-red-500 hover:text-red-700 p-1">
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t text-right">
            <p class="text-lg font-bold text-slate-800">
              Toplam: <span class="text-indigo-600">{{ formatCurrency(totalAmount) }}</span>
            </p>
          </div>
        </div>

        <!-- Completion & Email -->
        <div class="glass-card p-6">
          <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Send :size="20" class="text-indigo-600" /> Tamamla ve Gönder
          </h3>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-700 mb-1">Müşteri E-posta Adresi <span class="text-red-500">*</span></label>
            <input v-model="form.musteri_email" type="email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-indigo-200 bg-indigo-50" placeholder="Onay linki bu adrese gidecek">
            <p class="text-xs text-slate-500 mt-1">Teklifin tamamlanması için e-posta adresi zorunludur.</p>
          </div>

          <button 
            @click="submitQuote" 
            class="w-full btn btn-primary py-3 flex justify-center items-center gap-2" 
            :disabled="loading || !form.musteri_email"
          >
            <span v-if="loading" class="animate-spin">⏳</span>
            {{ loading ? 'Gönderiliyor...' : 'Teklifi Oluştur ve E-posta Gönder' }}
          </button>
        </div>

      </div>

      <!-- Right Side: PDF Preview -->
      <div class="w-1/2 flex flex-col glass-card p-0 overflow-hidden h-full">
        <div class="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 class="font-bold text-slate-700 flex items-center gap-2">
            <FileText :size="20" /> PDF Önizleme
          </h3>
          <button @click="$refs.fileInput.click()" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            {{ pdfPreviewUrl ? 'Dosyayı Değiştir' : 'PDF Yükle' }}
          </button>
          <input ref="fileInput" type="file" class="hidden" accept=".pdf" @change="handleFileSelect">
        </div>

        <div class="flex-1 bg-slate-200 relative">
          <iframe 
            v-if="pdfPreviewUrl" 
            :src="pdfPreviewUrl" 
            class="w-full h-full border-none"
          ></iframe>
          
          <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 cursor-pointer" @click="$refs.fileInput.click()">
            <UploadCloud :size="64" class="mb-4" />
            <p class="text-lg font-medium">PDF Dosyasını Buraya Sürükleyin</p>
            <p class="text-sm">veya tıklayarak seçin</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, FileText, Plus, Trash2, Send, UploadCloud, User, Package, History } from 'lucide-vue-next';

definePageMeta({
  middleware: 'auth',
});

const { apiFetch } = useApi();
const router = useRouter();

const loading = ref(false);
const selectedFile = ref(null);
const pdfPreviewUrl = ref(null);

// Customer State
const customerSearch = ref('');
const showCustomerDropdown = ref(false);
const customers = ref([]);
const filteredCustomers = ref([]);
const selectedCustomerId = ref(null);
const isNewCustomer = ref(false);

// Project State
const projectSearch = ref('');
const showProjectDropdown = ref(false);
const projects = ref([]);
const filteredProjects = ref([]);

const form = ref({
  musteri_adi: '',
  musteri_email: '',
  musteri_iletisim: '',
  proje_adi: '',
  items: [
    { malzeme_cinsi: '', miktar: 1, birim: 'Adet', birim_fiyat: 0, showDropdown: false, searchResults: [] }
  ]
});

const totalAmount = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (item.miktar * item.birim_fiyat), 0);
});

const isCustomerSelectedOrNew = computed(() => {
  return selectedCustomerId.value !== null || isNewCustomer.value;
});

onMounted(async () => {
  // Fetch customers for autocomplete
  try {
    const res = await apiFetch('/quotes/customers');
    if (res.success) {
      customers.value = res.data;
    }
  } catch (e) {
    console.error('Error fetching customers:', e);
  }
});

const filterCustomers = () => {
  const search = customerSearch.value.toLowerCase();
  form.value.musteri_adi = customerSearch.value; // Update form name as we type
  selectedCustomerId.value = null; // Reset selected customer if typing changes
  isNewCustomer.value = false;
  projects.value = []; // Clear projects
  projectSearch.value = '';
  form.value.proje_adi = '';
  
  if (!search) {
    filteredCustomers.value = [];
    return;
  }
  
  filteredCustomers.value = customers.value.filter(c => 
    c.musteri_adi.toLowerCase().includes(search)
  );
};

const selectCustomer = async (customer) => {
  customerSearch.value = customer.musteri_adi;
  form.value.musteri_adi = customer.musteri_adi;
  form.value.musteri_email = customer.musteri_email || '';
  form.value.musteri_iletisim = customer.musteri_iletisim_no || '';
  selectedCustomerId.value = customer.musteri_id;
  isNewCustomer.value = false;
  showCustomerDropdown.value = false;

  // Fetch projects for this customer
  try {
    const res = await apiFetch(`/quotes/customers/${customer.musteri_id}/projects`);
    if (res.success) {
      projects.value = res.data;
    }
  } catch (e) {
    console.error('Error fetching projects:', e);
  }
};

const addNewCustomer = () => {
  form.value.musteri_adi = customerSearch.value;
  form.value.musteri_email = '';
  form.value.musteri_iletisim = '';
  selectedCustomerId.value = null;
  isNewCustomer.value = true;
  showCustomerDropdown.value = false;
  projects.value = []; // New customer has no projects
};

const filterProjects = () => {
  const search = projectSearch.value.toLowerCase();
  form.value.proje_adi = projectSearch.value;
  
  if (!search) {
    filteredProjects.value = projects.value; // Show all if empty
    return;
  }
  
  filteredProjects.value = projects.value.filter(p => 
    p.proje_adi.toLowerCase().includes(search)
  );
};

const selectProject = (project) => {
  projectSearch.value = project.proje_adi;
  form.value.proje_adi = project.proje_adi;
  showProjectDropdown.value = false;
};

// Product Search
const searchProducts = async (index) => {
  const query = form.value.items[index].malzeme_cinsi;
  if (query.length < 2) {
    form.value.items[index].searchResults = [];
    return;
  }

  try {
    const res = await apiFetch(`/products?search=${query}&limit=5`);
    if (res.success) {
      form.value.items[index].searchResults = res.data;
    }
  } catch (e) {
    console.error('Error searching products:', e);
  }
};

const selectProduct = (index, product) => {
  form.value.items[index].malzeme_cinsi = product.urun_adi;
  form.value.items[index].birim = product.birim;
  form.value.items[index].showDropdown = false;
};

const fetchPreviousOrders = async () => {
  if (!selectedCustomerId.value) return;
  
  if (!confirm('Bu müşterinin önceki sipariş detayları mevcut kalemlerin üzerine eklensin mi?')) return;

  try {
    const params = new URLSearchParams({ musteri_id: selectedCustomerId.value });
    if (form.value.proje_adi) {
      params.append('proje_adi', form.value.proje_adi);
    }

    const res = await apiFetch(`/quotes/previous-orders?${params.toString()}`);
    
    if (res.success && res.data.length > 0) {
      // If the list only has one empty item, clear it first
      if (form.value.items.length === 1 && !form.value.items[0].malzeme_cinsi) {
        form.value.items = [];
      }
      
      form.value.items.push(...res.data.map(item => ({
        malzeme_cinsi: item.malzeme_cinsi,
        miktar: item.miktar,
        birim: item.birim,
        birim_fiyat: item.birim_fiyat,
        showDropdown: false,
        searchResults: []
      })));
    } else {
      alert('Önceki sipariş bulunamadı.');
    }
  } catch (e) {
    console.error('Error fetching previous orders:', e);
    alert('Siparişler getirilemedi.');
  }
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    selectedFile.value = file;
    // Add #view=FitH to try to force width fit, though browser support varies
    pdfPreviewUrl.value = URL.createObjectURL(file) + '#view=FitH';
  } else {
    alert('Lütfen geçerli bir PDF dosyası seçin.');
  }
};

const addItem = () => {
  form.value.items.push({ malzeme_cinsi: '', miktar: 1, birim: 'Adet', birim_fiyat: 0, showDropdown: false, searchResults: [] });
};

const removeItem = (index) => {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1);
  }
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
};

const submitQuote = async () => {
  if (!selectedFile.value) {
    alert('Lütfen bir PDF dosyası yükleyin.');
    return;
  }
  if (!form.value.musteri_email) {
    alert('Müşteri e-posta adresi zorunludur.');
    return;
  }

  loading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('data', JSON.stringify(form.value));

    const res = await apiFetch('/quotes/upload-workflow', {
      method: 'POST',
      body: formData,
    });

    if (res.success) {
      alert('Teklif başarıyla oluşturuldu ve müşteriye gönderildi.');
      router.push('/teklifler');
    }
  } catch (error) {
    console.error('Submit quote error:', error);
    alert('Teklif oluşturulurken hata oluştu.');
  } finally {
    loading.value = false;
  }
};
</script>
