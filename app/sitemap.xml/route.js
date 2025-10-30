// path: tamir/app/sitemap.xml/route.js
// MADDE 2: Kapsamlı ve Dinamik Sitemap
// Statik sayfaları listeler ve blog-server.js üzerindeki güvenli fonksiyonları kullanarak
// 'blog' ve 'analyses' koleksiyonlarından dinamik URL'leri çeker.

// blog-server.js'den güvenli fonksiyonlar import edildi.
import { getBlogPostsForSitemap, getAnalysesForSitemap } from '@/lib/blog-server';
// import { getAdminDb } from '@/firebase-admin'; // KRİTİK FİX: Kullanılmayan import kaldırıldı.

// ISR (Incremental Static Regeneration) - 1 saatlik yenileme
export const revalidate = 3600; // 1 saat

// Kanonik Temel URL (Madde 1 ile uyumlu)
// KRİTİK FİX: URL birleştirme hatalarını önlemek için sondaki '/' temizleniyor.
const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.synarasystem.com').replace(/\/$/, '');

/**
 * URL listesini XML formatına dönüştürür
 * @param {Array<object>} routes - { url, lastmod, changefreq, priority } objelerini içeren dizi
 */
function generateXml(routes) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  routes.forEach((route) => {
    xml += `
      <url>
        <loc>${route.url}</loc>
        <lastmod>${route.lastmod}</lastmod>
        <changefreq>${route.changefreq}</changefreq>
        <priority>${route.priority}</priority>
      </url>
    `;
  });

  xml += `\n</urlset>`;
  return xml;
}

/**
 * Date nesnesini ISO 8601 formatına (YYYY-MM-DD) çevirir, hata durumunda bugünün tarihini döner.
 * @param {Date | admin.firestore.Timestamp | string | number} dateInput 
 * @returns {string} ISO formatında tarih
 */
function safeToISOString(dateInput) {
  try {
    if (!dateInput) return new Date().toISOString().split('T')[0];

    // Firebase Timestamp objesi ise
    if (typeof dateInput === 'object' && dateInput.toDate) {
      return dateInput.toDate().toISOString().split('T')[0];
    }
    
    // Diğer türler için doğrudan Date objesi oluşturmayı dene
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];

  } catch (error) {
    // console.error("Tarih formatlama hatası:", error);
    return new Date().toISOString().split('T')[0];
  }
}


/**
 * Dinamik ve Statik tüm rotaları toplar
 * @returns {Promise<Array<object>>}
 */
async function generateSitemapRoutes() {
  const allRoutes = [];
  const today = safeToISOString(new Date());

  // 1. Statik Rotalar
  const staticRoutes = [
    { path: '/', changefreq: 'daily', priority: '1.0' }, // Özel durum: '/' ana dizin için
    { path: '/blog', changefreq: 'weekly', priority: '0.8' },
    { path: '/haberler', changefreq: 'daily', priority: '0.7' },
    { path: '/analyses', changefreq: 'daily', priority: '0.9' },
    { path: '/modules', changefreq: 'monthly', priority: '0.6' },
    { path: '/mesteg-referans', changefreq: 'monthly', priority: '0.5' },
    { path: '/about-us', changefreq: 'yearly', priority: '0.4' },
    { path: '/terms-of-service', changefreq: 'yearly', priority: '0.3' },
    { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  ];

  staticRoutes.forEach(route => {
    // KRİTİK FİX: '/' yolu için sadece baseUrl kullan. Diğerleri için '/path' şeklinde birleştir.
    const urlPath = route.path === '/' ? '' : route.path;
    allRoutes.push({
      url: `${baseUrl}${urlPath}`,
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  });

  // 2. Dinamik Blog Rotaları (lib/blog-server.js'den güvenli çekim)
  try {
    const posts = await getBlogPostsForSitemap();
    posts.forEach((post) => {
      const lastMod = safeToISOString(post.updatedAt || post.createdAt);
      allRoutes.push({
        // KRİTİK FİX: Dinamik URL birleştirme, baseUrl'ın sonunda '/' olmamasını garanti eder.
        url: `${baseUrl}/blog/${post.slug}`,
        lastmod: lastMod,
        changefreq: 'weekly',
        priority: '0.8',
      });
    });
  } catch (error) {
    console.error("Sitemap: Blog postları çekilirken hata oluştu:", error);
    // Hata durumunda bile statik rotalarla devam et
  }

  // 3. Dinamik Analiz Rotaları (lib/blog-server.js'den güvenli çekim)
  try {
    const analyses = await getAnalysesForSitemap();
    analyses.forEach((analysis) => {
      const lastMod = safeToISOString(analysis.updatedAt || analysis.createdAt);
      allRoutes.push({
        // KRİTİK FİX: Dinamik URL birleştirme, baseUrl'ın sonunda '/' olmamasını garanti eder.
        url: `${baseUrl}/analyses/${analysis.id}`,
        lastmod: lastMod,
        changefreq: 'daily',
        priority: '0.9',
      });
    });
  } catch (error) {
    console.error("Sitemap: Analizler çekilirken hata oluştu:", error);
    // Hata durumunda bile statik rotalarla devam et
  }
  
  return allRoutes;
}

/**
 * Sitemap XML'ini döndüren GET handler
 */
export async function GET() {
  const allRoutes = await generateSitemapRoutes();
  
  // XML oluştur ve yanıtı döndür
  try {
    const sitemapXml = generateXml(allRoutes);

    return new Response(sitemapXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        // Tarayıcı ve proxy'lerin her saat yenilemesini sağlar
        'Cache-Control': 'public, max-age=3600, must-revalidate', 
      },
    });
  } catch (error) {
    console.error("Sitemap XML oluşturulurken kritik hata:", error);
    // Kritik hata durumunda boş bir XML döndür
    const errorXml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
    return new Response(errorXml, {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
