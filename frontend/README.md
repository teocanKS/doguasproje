# Doğu AŞ Frontend (Nuxt 3)

Frontend application for Doğu AŞ Stok ve Süreç Takip Sistemi.

## Technology Stack

- **Framework:** Nuxt 3 (Vue.js)
- **Styling:** Tailwind CSS
- **Charts:** Chart.js
- **HTTP Client:** Nuxt useFetch / $fetch
- **Language:** Turkish UI, English code

## Installation

```bash
cd frontend
npm install
```

## Configuration

Create `.env` file (optional, defaults work):

```env
API_BASE_URL=http://localhost:3000/api
```

## Running the Application

### Development Mode:
```bash
npm run dev
```

The app will run on `http://localhost:3000` by default.

### Production Build:
```bash
npm run build
npm run preview
```

## Features

### Authentication
- User registration (creates as personel, requires admin approval)
- Login with approval check
- JWT token management
- Role-based access control (yonetici vs personel)

### Dashboard
- Key statistics (total products, low stock alerts, active jobs)
- Critical stock table with RED highlighting
- Monthly profit/loss chart
- Most active products chart
- AI demand forecast (Simple Moving Average)
- Inactivity alerts (admin only)

### Stock Status
- Product listing with search and category filtering
- **Critical level highlighting** (RED when stock < reference value)
- Real-time stock display

### Active Jobs
- Create new jobs (Alış/Satış)
- Product cart system
- **Survey modal on completion:**
  - 3 questions (1-5 star rating)
  - Teslimat Hızı
  - Eksiksiz Teslimat
  - Fiyat/Performans
  - Automatic average calculation
- Active jobs list

### History
- Completed transactions list
- Date range filtering
- Transaction type filtering
- Detailed transaction view

### Admin Pages
- **User Approvals:** Approve pending users
- **Logs:** System logs with JSON before/after comparison

## Project Structure

```
frontend/
├── assets/          # CSS and static assets
├── components/      # Reusable Vue components
├── composables/     # Vue composables (useAuth, useApi)
├── layouts/         # Page layouts
├── middleware/      # Route middleware (auth, admin)
├── pages/           # Application pages
│   ├── index.vue           # Dashboard
│   ├── login.vue           # Login page
│   ├── register.vue        # Registration page
│   ├── stok.vue            # Stock status
│   ├── aktif-isler.vue     # Active jobs
│   ├── gecmis.vue          # History
│   └── admin/              # Admin pages
│       ├── kullanici-onaylari.vue
│       └── loglar.vue
├── nuxt.config.ts   # Nuxt configuration
└── package.json     # Dependencies
```

## Deployment

### Build for Production:
```bash
npm run build
```

### Serve with PM2:
```bash
npm install -g pm2
pm2 start npm --name "doguas-frontend" -- run preview
pm2 startup
pm2 save
```

### Nginx Configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Support

For issues or questions, contact the development team.
