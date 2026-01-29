<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 px-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Kayıt Ol</h1>
          <p class="text-gray-600 mt-2">Doğu AŞ Envanter ve Süreç Takip Sistemi</p>
        </div>

        <div v-if="successMessage" class="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {{ errorMessage }}
        </div>

        <form v-if="!registrationComplete" @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ad</label>
            <input
              v-model="formData.name"
              type="text"
              required
              class="input"
              placeholder="Ahmet"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
            <input
              v-model="formData.surname"
              type="text"
              required
              class="input"
              placeholder="Yılmaz"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              v-model="formData.email"
              type="email"
              required
              class="input"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input
              v-model="formData.password"
              type="password"
              required
              minlength="6"
              class="input"
              placeholder="En az 6 karakter"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full btn btn-primary py-3 text-lg"
          >
            {{ loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Zaten hesabınız var mı?
            <NuxtLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
              Giriş Yapın
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false,
});

const { register } = useAuth();

const formData = ref({
  name: '',
  surname: '',
  email: '',
  password: '',
});

const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const registrationComplete = ref(false);

const handleRegister = async () => {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  
  const result = await register(
    formData.value.email,
    formData.value.password,
    formData.value.name,
    formData.value.surname
  );
  
  if (result.success) {
    registrationComplete.value = true;
    successMessage.value = result.message || 'Kayıt başarılı! Yönetici onayı bekleniyor. Onaylandıktan sonra giriş yapabilirsiniz.';
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      navigateTo('/login');
    }, 3000);
  } else {
    errorMessage.value = result.error || 'Kayıt başarısız oldu.';
  }
  
  loading.value = false;
};
</script>
