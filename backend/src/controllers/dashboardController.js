const db = require('../config/db');

/**
 * Get dashboard statistics
 */
const getStats = async (req, res) => {
  try {
    // Total products
    const productsResult = await db.query('SELECT COUNT(*) FROM urun');
    const totalProducts = Number(productsResult.rows[0]?.count) || 0;

    // Low stock count (below critical level)
    const lowStockResult = await db.query(
      `SELECT COUNT(*) FROM urun u
       LEFT JOIN urun_stok s ON u.urun_id = s.urun_id
       WHERE COALESCE(s.toplam_stok, 0) < COALESCE(s.referans_degeri, 0)`
    );
    const lowStockCount = Number(lowStockResult.rows[0]?.count) || 0;

    // Active jobs count
    const activeJobsMusteri = await db.query(
      `SELECT COUNT(*) FROM urun_musteri_islem WHERE islemin_durumu = 'DEVAM EDIYOR'`
    );
    const activeJobsTedarikci = await db.query(
      `SELECT COUNT(*) FROM urun_tedarikci_alis WHERE alis_durumu = false`
    );
    const musteriCount = Number(activeJobsMusteri.rows[0]?.count) || 0;
    const tedarikciCount = Number(activeJobsTedarikci.rows[0]?.count) || 0;
    const activeJobsCount = musteriCount + tedarikciCount;

    res.json({
      success: true,
      stats: {
        totalProducts,
        lowStockCount,
        activeJobsCount,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'İstatistikler alınamadı.' });
  }
};

/**
 * Get profit chart data (monthly income - expense)
 */
const getProfitChart = async (req, res) => {
  try {
    // Validate and clamp months parameter to prevent extreme ranges
    const monthsInput = Number(req.query.months);
    if (req.query.months !== undefined && (!Number.isInteger(monthsInput) || monthsInput < 1 || monthsInput > 24)) {
      return res.status(400).json({ error: 'months parametresi 1 ile 24 arasında bir tam sayı olmalıdır.' });
    }
    const months = Number.isInteger(monthsInput) ? Math.min(Math.max(monthsInput, 1), 24) : 12;

    const result = await db.query(
      `WITH monthly_data AS (
        SELECT 
          TO_CHAR(islem_tarihi, 'YYYY-MM') AS month,
          SUM(toplam_satis_tutari) AS income,
          0 AS expense
        FROM urun_musteri_islem
        WHERE islemin_durumu = 'TAMAMLANDI'
          AND islem_tarihi >= NOW() - ($1 * INTERVAL '1 month')
        GROUP BY TO_CHAR(islem_tarihi, 'YYYY-MM')
        
        UNION ALL
        
        SELECT 
          TO_CHAR(alis_tarihi, 'YYYY-MM') AS month,
          0 AS income,
          SUM(toplam_alis_tutari) AS expense
        FROM urun_tedarikci_alis
        WHERE alis_durumu = true
          AND alis_tarihi >= NOW() - ($1 * INTERVAL '1 month')
        GROUP BY TO_CHAR(alis_tarihi, 'YYYY-MM')
      )
      SELECT 
        month,
        ROUND(SUM(income)::numeric, 2) AS total_income,
        ROUND(SUM(expense)::numeric, 2) AS total_expense,
        ROUND((SUM(income) - SUM(expense))::numeric, 2) AS profit
      FROM monthly_data
      GROUP BY month
      ORDER BY month`,
      [months]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get profit chart error:', error);
    res.status(500).json({ error: 'Kâr grafiği alınamadı.' });
  }
};

/**
 * Get most active products
 */
const getActiveProducts = async (req, res) => {
  try {
    // Parse and clamp limit to prevent abusive requests
    const DEFAULT_LIMIT = 10;
    const MIN_LIMIT = 1;
    const MAX_LIMIT = 100;
    const limitNum = Number(req.query.limit);
    const limit = Number.isInteger(limitNum)
      ? Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, limitNum))
      : DEFAULT_LIMIT;

    const result = await db.query(
      `WITH sales AS (
        SELECT 
          urun_id,
          COALESCE(SUM(satilan_adet), 0) AS total_sales
        FROM urun_musteri_islem
        WHERE islemin_durumu = 'TAMAMLANDI'
        GROUP BY urun_id
      ),
      purchases AS (
        SELECT 
          urun_id,
          COALESCE(SUM(alinan_adet), 0) AS total_purchases
        FROM urun_tedarikci_alis
        WHERE alis_durumu = true
        GROUP BY urun_id
      )
      SELECT 
        u.urun_id,
        u.urun_adi,
        COALESCE(s.total_sales, 0) AS total_sales,
        COALESCE(p.total_purchases, 0) AS total_purchases
      FROM urun u
      LEFT JOIN sales s ON s.urun_id = u.urun_id
      LEFT JOIN purchases p ON p.urun_id = u.urun_id
      WHERE COALESCE(s.total_sales, 0) > 0 OR COALESCE(p.total_purchases, 0) > 0
      ORDER BY COALESCE(s.total_sales, 0) DESC, COALESCE(p.total_purchases, 0) DESC
      LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get active products error:', error);
    res.status(500).json({ error: 'Aktif ürünler alınamadı.' });
  }
};

/**
 * Get AI forecast using Simple Moving Average (SMA)
 */
const getForecast = async (req, res) => {
  try {
    // Validate and clamp limit parameter
    const DEFAULT_LIMIT = 5;
    const MAX_LIMIT = 50;
    let limit;
    if (req.query.limit === undefined) {
      limit = DEFAULT_LIMIT;
    } else {
      const parsedLimit = Number(req.query.limit);
      if (!Number.isFinite(parsedLimit) || !Number.isInteger(parsedLimit) || parsedLimit < 1) {
        return res.status(400).json({ error: 'Geçersiz limit parametresi.' });
      }
      limit = Math.min(parsedLimit, MAX_LIMIT);
    }

    // Get monthly sales data for top products (last 6 months)
    const result = await db.query(
      `WITH product_monthly_sales AS (
        SELECT 
          i.urun_id,
          u.urun_adi,
          TO_CHAR(i.islem_tarihi, 'YYYY-MM') AS month,
          SUM(i.satilan_adet) AS quantity
        FROM urun_musteri_islem i
        JOIN urun u ON i.urun_id = u.urun_id
        WHERE i.islemin_durumu = 'TAMAMLANDI'
          AND i.islem_tarihi >= NOW() - INTERVAL '6 months'
        GROUP BY i.urun_id, u.urun_adi, TO_CHAR(i.islem_tarihi, 'YYYY-MM')
      ),
      product_totals AS (
        SELECT 
          urun_id,
          urun_adi,
          AVG(quantity) AS avg_monthly_demand,
          COUNT(*) AS months_count
        FROM product_monthly_sales
        GROUP BY urun_id, urun_adi
        HAVING COUNT(*) >= 3
      )
      SELECT 
        urun_id,
        urun_adi,
        ROUND(avg_monthly_demand, 2) AS predicted_next_month_demand,
        months_count AS data_points
      FROM product_totals
      ORDER BY avg_monthly_demand DESC
      LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      message: 'Basit Hareketli Ortalama (SMA) kullanılarak hesaplandı.',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({ error: 'Tahmin alınamadı.' });
  }
};



/**
 * Get inactivity alerts (Admin only)
 */
const getInactivityAlerts = async (req, res) => {
  try {
    // Customers with no purchases keep inactivity_days = NULL; handle NULL explicitly in the outer query
    const result = await db.query(
      `WITH customer_last_purchase AS (
        SELECT 
          m.musteri_id,
          m.musteri_adi,
          m.musteri_iletisim_no AS telefon,
          MAX(i.islem_tarihi) AS son_alis_tarihi,
          NOW()::date - MAX(i.islem_tarihi)::date AS inactivity_days
        FROM musteri m
        LEFT JOIN urun_musteri_islem i ON m.musteri_id = i.musteri_id
        GROUP BY m.musteri_id, m.musteri_adi, m.musteri_iletisim_no
      )
      SELECT 
        musteri_id AS id,
        musteri_adi,
        telefon,
        son_alis_tarihi,
        inactivity_days,
        CASE 
          WHEN son_alis_tarihi IS NULL THEN 'danger'
          WHEN inactivity_days >= 120 THEN 'danger'
          WHEN inactivity_days >= 60 THEN 'warning'
          WHEN inactivity_days >= 30 THEN 'caution'
          ELSE 'normal'
        END AS alert_level
      FROM customer_last_purchase
      WHERE inactivity_days >= 30 OR son_alis_tarihi IS NULL
      ORDER BY CASE WHEN son_alis_tarihi IS NULL THEN 0 ELSE 1 END, inactivity_days DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get inactivity alerts error:', error);
    res.status(500).json({ error: 'Hareketsizlik uyarıları alınamadı.' });
  }
};

module.exports = {
  getStats,
  getProfitChart,
  getActiveProducts,
  getForecast,

  getInactivityAlerts,
};
