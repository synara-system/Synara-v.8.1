// path: lib/blog-client-utils.js
// 'use client' zorunluluğu yoktur, ancak Client Component'ler tarafından çağrılacağı için burada kalır.

/**
 * KRİTİK FİX GÜNCELLEMESİ: Medya Öncelik Protokolü (3 Aşamalı)
 * Post verisine göre uygun medya URL'sini (Banner, YouTube veya Placeholder) döndürür.
 * Bu fonksiyon, BlogIndexClient ve NewsArticleGrid tarafından ortaklaşa kullanılır.
 */
export const getPostMediaUrl = (post) => {
    let url = post.bannerImageUrl;

    // 1. Banner Image Kontrolü ve Güvenlik Filtresi
    if (url && typeof url === 'string' && url.length > 0 && url.startsWith('https://')) {
        
        // KRİTİK FİLTRE: Imgur sayfa/albüm linklerini REDDET. Sadece i.imgur.com'a izin ver (direkt görsel).
        if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
             // Bu bir sayfa linkidir. Geçersiz kabul et ve placeholder'a düş.
             url = null;
        } else if (url.includes('i.imgur.com')) {
             // PERFORMANS FİKSİ: Imgur'dan çekilen görsellere thumbnail parametresi ekleniyor.
             // maxwidth=500, görselin boyutunu küçültür ve sayfa yükünü azaltır.
             return `${url}?maxwidth=500&fidelity=true`;
        } else {
             // Diğer tüm geçerli HTTPS URL'lerini kullan.
             return url;
        }
    }
    
    // 2. YouTube Video Küçük Resmi Kontrolü
    const validYoutubeId = post.youtubeVideoId && typeof post.youtubeVideoId === 'string' && post.youtubeVideoId.length === 11 ? post.youtubeVideoId : null;
    if (validYoutubeId) {
        // En yüksek çözünürlüklü YouTube küçük resmini kullan
        return `https://img.youtube.com/vi/${validYoutubeId}/maxresdefault.jpg`;
    }
    
    // 3. Kategori Temalı Placeholder (Yoksa)
    const category = post.category || 'Synara Yazısı';
    let themeColor;
    
    // KRİTİK FİX: Kategoriye göre renk ataması (Haberler için Kırmızı/Red, Blog için Indigo)
    if (['Analiz', 'Eğitim', 'Sistem', 'Güncelleme'].includes(category)) {
        themeColor = '4F46E5'; // Indigo (Blog teması)
    } else {
        themeColor = 'EF4444'; // Red (Haber teması)
    }

    const textColor = 'FFFFFF';
    const textContent = encodeURIComponent(category);

    return `https://placehold.co/1280x720/${themeColor}/${textColor}?text=${textContent}`;
}
