const db = require('../config/db');

/**
 * Get Category Sales Distribution (Pie Chart)
 */
const getCategorySales = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COALESCE(u.kategori, 'Diğer') as category, 
                SUM(umi.satilan_adet) as total_quantity
            FROM urun_musteri_islem umi
            JOIN urun u ON umi.urun_id = u.urun_id
            WHERE umi.islemin_durumu = 'TAMAMLANDI'
            GROUP BY u.kategori
            ORDER BY total_quantity DESC
        `);

        // Format for Chart.js
        const labels = result.rows.map(row => row.category);
        const data = result.rows.map(row => parseInt(row.total_quantity));

        // Generate colors (simple palette)
        const backgroundColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ];

        res.json({
            success: true,
            chartData: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    hoverOffset: 4
                }]
            }
        });
    } catch (error) {
        console.error('Category sales error:', error);
        res.status(500).json({ error: 'Kategori verileri alınamadı.' });
    }
};

/**
 * Get Critical Stock vs Reference Value (Mixed Chart)
 */
const getStockAnalysis = async (req, res) => {
    try {
        const { category } = req.query;
        let query = `
            SELECT 
                u.urun_adi,
                u.urun_id,
                s.toplam_stok,
                s.referans_degeri
            FROM urun u
            JOIN urun_stok s ON u.urun_id = s.urun_id
        `;

        const params = [];
        if (category) {
            query += ` WHERE u.kategori = $1`;
            params.push(category);
        }

        query += ` ORDER BY u.urun_id ASC`;

        // Only limit if no category selected to avoid clutter, 
        // but show all if filtered
        if (!category) {
            query += ` LIMIT 15`;
        }

        const result = await db.query(query, params);

        const labels = result.rows.map(row => row.urun_adi);

        // Helper to safely parse numeric values, defaulting to 0 for null/NaN
        const safeParseInt = (val) => {
            const parsed = parseInt(val);
            return Number.isNaN(parsed) ? 0 : parsed;
        };

        // Calculate colors based on stock vs reference
        const backgroundColors = result.rows.map(row => {
            const stock = Math.max(0, safeParseInt(row.toplam_stok));
            const ref = safeParseInt(row.referans_degeri);
            // User requested "on the line" to be red too, so <=
            return stock <= ref ? 'rgba(239, 68, 68, 0.8)' : 'rgba(99, 102, 241, 0.6)'; // Red if critical, Indigo otherwise
        });

        const borderColors = result.rows.map(row => {
            const stock = Math.max(0, safeParseInt(row.toplam_stok));
            const ref = safeParseInt(row.referans_degeri);
            return stock <= ref ? '#ef4444' : '#6366f1';
        });

        const xLabelColors = result.rows.map(row => {
            const stock = Math.max(0, safeParseInt(row.toplam_stok));
            const ref = safeParseInt(row.referans_degeri);
            return stock <= ref ? '#ef4444' : '#64748b'; // Red if critical, Slate-500 otherwise
        });

        res.json({
            success: true,
            chartData: {
                labels: labels, // Use Names for X-axis
                names: labels,
                xLabelColors: xLabelColors, // Send colors for frontend to use
                datasets: [
                    {
                        type: 'bar',
                        label: 'Mevcut Stok',
                        data: result.rows.map(row => Math.max(0, safeParseInt(row.toplam_stok))),
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 2,
                        borderRadius: 4,
                        barPercentage: 0.6,
                        maxBarThickness: 50, // Prevent huge bars
                    },
                    {
                        type: 'line',
                        label: 'Referans Değeri',
                        data: result.rows.map(row => safeParseInt(row.referans_degeri)),
                        borderColor: '#ef4444', // Reverted to Red as requested
                        borderWidth: 3,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#fff',
                        pointRadius: 4,
                        tension: 0.4
                    }
                ]
            }
        });
    } catch (error) {
        console.error('Stock analysis error:', error);
        res.status(500).json({ error: 'Stok analiz verileri alınamadı.' });
    }
};

/**
 * Get Top 5 Profitable Customers
 */
const getTopCustomers = async (req, res) => {
    try {
        // Calculate profit: (Sell Price - Avg Buy Price) * Quantity
        // We use a CTE to get avg buy price first
        const query = `
            WITH ProductCosts AS (
                SELECT urun_id, AVG(urun_alis_fiyati) as avg_cost
                FROM urun_tedarikci_alis
                GROUP BY urun_id
            )
            SELECT 
                m.musteri_adi as customer_name,
                SUM( (umi.urun_satis_fiyati - COALESCE(pc.avg_cost, 0)) * umi.satilan_adet ) as total_profit
            FROM urun_musteri_islem umi
            JOIN musteri m ON umi.musteri_id = m.musteri_id
            LEFT JOIN ProductCosts pc ON umi.urun_id = pc.urun_id
            WHERE umi.islemin_durumu = 'TAMAMLANDI'
            GROUP BY m.musteri_id, m.musteri_adi
            ORDER BY total_profit DESC
            LIMIT 5
        `;

        const result = await db.query(query);

        res.json({
            success: true,
            chartData: {
                labels: result.rows.map(row => row.customer_name),
                datasets: [
                    {
                        label: 'Toplam Net Kâr (TL)',
                        data: result.rows.map(row => parseFloat(row.total_profit ?? 0)),
                        backgroundColor: [
                            '#f472b6', '#fb7185', '#f43f5e', '#e11d48', '#be123c' // Pink/Red gradient
                        ],
                        borderRadius: 5,
                        barThickness: 30
                    }
                ]
            }
        });

    } catch (error) {
        console.error('Top customers error:', error);
        res.status(500).json({ error: 'Müşteri analiz verileri alınamadı.' });
    }
};

/**
 * Get AI-Generated Insights
 */
const getInsights = async (req, res) => {
    try {
        // Simple rule-based insights for now
        // In a real AI scenario, we would feed this data to an LLM

        const salesResult = await db.query(`
            SELECT SUM(toplam_satis_tutari) as total
            FROM urun_musteri_islem
            WHERE islemin_durumu = 'TAMAMLANDI'
            AND islem_tarihi >= NOW() - INTERVAL '30 days'
        `);

        const prevSalesResult = await db.query(`
            SELECT SUM(toplam_satis_tutari) as total
            FROM urun_musteri_islem
            WHERE islemin_durumu = 'TAMAMLANDI'
            AND islem_tarihi >= NOW() - INTERVAL '60 days'
            AND islem_tarihi < NOW() - INTERVAL '30 days'
        `);

        const currentSales = parseFloat(salesResult.rows[0]?.total ?? 0);
        const prevSales = parseFloat(prevSalesResult.rows[0]?.total ?? 0);

        const insights = [];

        // Sales Trend Insight
        if (currentSales > prevSales) {
            const percent = prevSales > 0 ? ((currentSales - prevSales) / prevSales * 100).toFixed(1) : 100;
            insights.push({
                type: 'positive',
                title: 'Satışlar Artıyor',
                message: `Son 30 günde satışlar önceki döneme göre %${percent} artış gösterdi.`
            });
        } else if (currentSales < prevSales) {
            const percent = prevSales > 0
                ? ((prevSales - currentSales) / prevSales * 100).toFixed(1)
                : null;
            insights.push({
                type: 'negative',
                title: 'Satışlarda Düşüş',
                message: percent === null
                    ? 'Son 30 günde satışlar önceki döneme göre tamamen durdu. Kampanya yapmayı düşünebilirsiniz.'
                    : `Son 30 günde satışlar önceki döneme göre %${percent} azaldı. Kampanya yapmayı düşünebilirsiniz.`
            });
        }

        // Top Category Insight
        const topCatResult = await db.query(`
            SELECT u.kategori, SUM(umi.satilan_adet) as total
            FROM urun_musteri_islem umi
            JOIN urun u ON umi.urun_id = u.urun_id
            WHERE umi.islemin_durumu = 'TAMAMLANDI'
            AND islem_tarihi >= NOW() - INTERVAL '30 days'
            GROUP BY u.kategori
            ORDER BY total DESC
            LIMIT 1
        `);

        if (topCatResult.rows.length > 0) {
            insights.push({
                type: 'info',
                title: 'Favori Kategori',
                message: `Bu ayın en çok tercih edilen kategorisi: **${topCatResult.rows[0].kategori}**.`
            });
        }

        res.json({ success: true, insights });
    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ error: 'Analiz verileri alınamadı.' });
    }
};

/**
 * Get Product List for Dropdown
 */
const getProductList = async (req, res) => {
    try {
        const result = await db.query('SELECT urun_id, urun_adi FROM urun ORDER BY urun_adi');
        res.json({ success: true, products: result.rows });
    } catch (error) {
        console.error('Product list error:', error);
        res.status(500).json({ error: 'Ürün listesi alınamadı.' });
    }
};

/**
 * Get Profit Analysis for Specific Product
 */
const getProfitAnalysis = async (req, res) => {
    const { urunId } = req.query;

    if (!urunId) {
        return res.status(400).json({ error: 'Ürün ID gereklidir.' });
    }

    try {
        // Calculate Average Sell Price
        const salesResult = await db.query(`
            SELECT AVG(urun_satis_fiyati) as avg_sell_price
            FROM urun_musteri_islem
            WHERE urun_id = $1 AND islemin_durumu = 'TAMAMLANDI'
        `, [urunId]);

        // Calculate Average Buy Price
        const purchaseResult = await db.query(`
            SELECT AVG(urun_alis_fiyati) as avg_buy_price
            FROM urun_tedarikci_alis
            WHERE urun_id = $1
        `, [urunId]);

        const avgSellPrice = parseFloat(salesResult.rows[0].avg_sell_price || 0);
        const avgBuyPrice = parseFloat(purchaseResult.rows[0].avg_buy_price || 0);

        res.json({
            success: true,
            chartData: {
                labels: ['Ortalama Alış Fiyatı', 'Ortalama Satış Fiyatı'],
                datasets: [{
                    label: 'Fiyat (TL)',
                    data: [avgBuyPrice, avgSellPrice],
                    backgroundColor: ['#ef4444', '#22c55e'], // Red for Buy (Cost), Green for Sell (Revenue)
                    borderRadius: 5
                }]
            }
        });
    } catch (error) {
        console.error('Profit analysis error:', error);
        res.status(500).json({ error: 'Kar analizi yapılamadı.' });
    }
};

module.exports = {
    getCategorySales,
    getStockAnalysis,
    getInsights,
    getProductList,
    getProfitAnalysis,
    getTopCustomers
};
