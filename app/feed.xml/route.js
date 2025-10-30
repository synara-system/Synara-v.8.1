// path: fix25-stabil/app/feed.xml/route.js
import { getBaseUrl } from '@/lib/trpc/utils';
// FIX: lib/blog-server.js dosyasından yalnızca gerekli olan 'getPosts' fonksiyonunu
// adlandırılmış içe aktarım (named export) olarak çağırıyoruz.
import { getPosts } from '@/lib/blog-server'; 

// Blog Server'dan çekilen verilerle RSS 2.0 formatında XML çıktısı oluşturur.

// Cache ayarları
export const revalidate = 60 * 60 * 2; // 2 saatte bir yeniden doğrula (7200 saniye)

/**
 * Blog gönderilerinden RSS 2.0 XML dizesini oluşturur.
 * @param {Array} posts - Blog gönderileri dizisi.
 * @param {string} baseUrl - Uygulamanın temel URL'si.
 * @returns {string} RSS 2.0 XML dizesi.
 */
const generateRssFeed = (posts, baseUrl) => {
    const channelItems = posts.map(post => {
        const postUrl = `${baseUrl}/blog/${post.slug}`;
        // HTML etiketlerini temizle ve metin içeriğini kısalt
        const description = post.content ? post.content.replace(/<[^>]*>?/gm, '').substring(0, 300) + '...' : 'İçerik özeti mevcut değil.';
        
        // Güvenli tarih formatlama kontrolü eklendi.
        const pubDate = post.createdAt ? new Date(post.createdAt).toUTCString() : new Date().toUTCString();

        return `
            <item>
                <title><![CDATA[${post.title}]]></title>
                <link>${postUrl}</link>
                <guid>${postUrl}</guid>
                <description><![CDATA[${description}]]></description>
                <pubDate>${pubDate}</pubDate>
            </item>
        `;
    }).join('');

    // RSS 2.0 XML yapısını oluşturur.
    return `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
            <channel>
                <title>Synara System Blog | Teyitli Sinyaller ve Analiz</title>
                <link>${baseUrl}/blog</link>
                <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
                <description>Synara'nın bütünsel zeka felsefesi, kripto ve finansal piyasalar üzerine en güncel analizler ve teyitli eğitimler.</description>
                <language>tr</language>
                <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
                ${channelItems}
            </channel>
        </rss>
    `;
};

/**
 * RSS Feed'i döndüren Route Handler.
 * @returns {Response} XML formatında HTTP yanıtı.
 */
export const GET = async () => {
    try {
        const baseUrl = getBaseUrl();
        
        // Düzeltme sonrası doğrudan fonksiyon çağrısı
        // Blog-server'da getPosts limiti 20 olarak tanımlanmıştır.
        const posts = await getPosts(); 

        if (!posts || posts.length === 0) {
            console.warn('Sistemde blog post bulunamadı. Boş RSS feed döndürülüyor.');
            const emptyRss = generateRssFeed([], baseUrl);
            return new Response(emptyRss, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600',
                },
            });
        }
        
        const rss = generateRssFeed(posts, baseUrl);

        return new Response(rss, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600',
            },
        });
    } catch (error) {
        // Hata yakalama ve kullanıcıya 500 hatası döndürme
        console.error('RSS Feed generation failed:', error.message);
        return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Hata</title><link>${getBaseUrl()}</link><description>RSS beslemesi yüklenirken kritik bir hata oluştu: ${error.message}</description></channel></rss>`, {
            status: 500,
            headers: { 'Content-Type': 'application/xml' },
        });
    }
};
