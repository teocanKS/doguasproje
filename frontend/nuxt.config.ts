export default defineNuxtConfig({
    devtools: { enabled: true },

    modules: [
        '@nuxtjs/tailwindcss',
    ],

    // Add auto-imports for Lucide icons
    imports: {
        dirs: ['composables']
    },

    css: ['~/assets/css/main.css'],

    runtimeConfig: {
        public: {
            apiBase: 'https://doguaspanel.ch/api',
        },
    },

    nitro: {
        port: 3001,
        host: '0.0.0.0'
    },

    app: {
        head: {
            title: 'Doğu AŞ Stok ve Süreç Takip Sistemi',
            link: [
                { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' }
            ],
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'description', content: 'Doğu AŞ Stok ve Süreç Takip Sistemi' },
            ],
        },
    },

    compatibilityDate: '2024-11-28',
})
