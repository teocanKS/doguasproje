<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Kullanıcı Onayları</h1>

    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-600">
        Yükleniyor...
      </div>

      <div v-else-if="pendingUsers && pendingUsers.length > 0" class="space-y-4">
        <div
          v-for="user in pendingUsers"
          :key="user.id"
          class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="font-semibold text-lg">{{ user.name }} {{ user.surname }}</p>
              <p class="text-sm text-gray-600">{{ user.email }}</p>
              <p class="text-xs text-gray-500 mt-1">Kayıt Tarihi: {{ new Date(user.created_at).toLocaleDateString('tr-TR') }}</p>
            </div>

            <div class="flex gap-2">
              <button
                @click="rejectUser(user.id)"
                class="btn bg-red-600 hover:bg-red-700 text-white"
              >
                Reddet
              </button>
              <button
                @click="approveUser(user.id)"
                class="btn btn-primary"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        Onay bekleyen kullanıcı yok
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin',
});

const { apiFetch } = useApi();

const pendingUsers = ref([]);
const loading = ref(true);

onMounted(() => {
  fetchPendingUsers();
});

const fetchPendingUsers = async () => {
  try {
    const response = await apiFetch('/users/pending');
    pendingUsers.value = response.users;
  } catch (error) {
    console.error('Error fetching pending users:', error);
  } finally {
    loading.value = false;
  }
};

const approveUser = async (userId) => {
  if (!confirm('Bu kullanıcıyı onaylamak istediğinize emin misiniz?')) {
    return;
  }

  try {
    const response = await apiFetch(`/users/${userId}/approve`, {
      method: 'PUT',
    });

    if (response.success) {
      alert('Kullanıcı başarıyla onaylandı!');
      await fetchPendingUsers();
    }
  } catch (error) {
    alert('Kullanıcı onaylanırken hata oluştu: ' + (error.data?.error || 'Bilinmeyen hata'));
  }
};

const rejectUser = async (userId) => {
  if (!confirm('Bu kullanıcı başvurusunu reddetmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
    return;
  }

  try {
    const response = await apiFetch(`/users/${userId}/reject`, {
      method: 'DELETE',
    });

    if (response.success) {
      alert('Kullanıcı başvurusu reddedildi ve silindi.');
      await fetchPendingUsers();
    }
  } catch (error) {
    alert('Kullanıcı reddedilirken hata oluştu: ' + (error.data?.error || 'Bilinmeyen hata'));
  }
};
</script>
