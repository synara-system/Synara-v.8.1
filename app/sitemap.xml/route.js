// path: app/sitemap.xml/route.js
import { NextResponse } from 'next/server';
// KRİTİK DÜZELTME: Doğru fonksiyon isimleri ve tek bir kaynaktan import.
import { getBlogPostsForSitemap, getAnalysesForSitemap } from '@/lib/blog-server';
import { logger } from '@/lib/Logger';

// KRİTİK DÜZELTME: BASE_URL artık www içerir
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.synarasystem.com'; 

export async function GET() {
    try {
        const staticPages = [
            '/',
            '/about-us',
            '/vision',
            '/modules',
            '/modules/engine',
            '/modules/nexus',
            '/modules/metis',
            '/modules/rsi-han',
            '/modules/visuals',
            '/analyses',
            '/blog',
            '/haberler',
            // KRİTİK FİX: Login/Register/Legal sayfaları sitemap'ten kaldırıldı. (Genellikle sitemap'e eklenmezler)
            // Ancak SEO için korunmaları isteniyorsa eklenebilir. Şimdilik kaldırıldı.
            // '/login',
            // '/register',
            // '/terms-of-service',
            // '/privacy-policy',
        ].map((url) => ({
            url: `${BASE_URL}${url}`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: url === '/' ? 1.0 : 0.8,
        }));

        // Blog ve Analiz verilerini çek
        // KRİTİK DÜZELTME: Doğru fonksiyon isimleri kullanılıyor.
        const blogPosts = await getBlogPostsForSitemap(); 
        const analyses = await getAnalysesForSitemap();
        
        const dynamicBlogPages = blogPosts.map((post) => ({
            url: `${BASE_URL}/blog/${post.slug}`,
            lastModified: post.updatedAt || post.createdAt,
            changeFrequency: 'weekly',
            priority: 0.6,
        }));

        const dynamicAnalysisPages = analyses.map((analysis) => ({
             url: `${BASE_URL}/analyses/${analysis.id}`,
             lastModified: analysis.updatedAt || analysis.createdAt,
             changeFrequency: 'daily',
             priority: 0.7,
        }));

        const allUrls = [...staticPages, ...dynamicBlogPages, ...dynamicAnalysisPages];

        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${allUrls.map(url => `
        <url>
            <loc>${url.url}</loc>
            <lastmod>${new Date(url.lastModified).toISOString()}</lastmod>
            <changefreq>${url.changeFrequency}</changefreq>
            <priority>${url.priority}</priority>
        </url>
    `).join('')}
</urlset>`;

        return new NextResponse(sitemapContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=0, must-revalidate',
            },
        });

    } catch (error) {
        logger.error('Sitemap oluşturulurken hata:', error);
        return new NextResponse('Sitemap oluşturulamadı.', { status: 500 });
    }
}
