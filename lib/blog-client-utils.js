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

/**
 * v1.0.1 - SEO Refactor Eklentisi
 * SEO dostu, Türkçe karakterleri destekleyen URL-slug (URL-dostu-isim) oluşturur.
 * Admin paneli ve sunucu tarafı mantığı tarafından kullanılacak.
 * @param {string} text 
 * @returns {string}
 */
export const slugify = (text) => {
    if (typeof text !== 'string') return '';

    // Diğer latin karakterleri (é, à, â vb.) ve Türkçe karakterleri (ı, ğ, ü, ş, ö, ç)
    // normal harflere dönüştüren haritalama.
    const a = 'âàäáãåāæçćčèéêëēîïíīìñńóôöòõōøśšûüùúūýžźż';
    const b = 'aaaaaaaaacccceeeeeeeeiiiiiiinnooooooooosssuuuuuuyzzz';
    const p = new RegExp(a.split('').join('|'), 'g');

    return text.toString().toLowerCase()
        .replace(/ı/g, 'i') // Türkçe: ı -> i
        .replace(/ğ/g, 'g') // Türkçe: ğ -> g
        .replace(/ü/g, 'u') // Türkçe: ü -> u
        .replace(/ş/g, 's') // Türkçe: ş -> s
        .replace(/ö/g, 'o') // Türkçe: ö -> o
        .replace(/ç/g, 'c') // Türkçe: ç -> c
        .replace(p, c => b.charAt(a.indexOf(c))) // Diğer latin karakterleri dönüştür
        .replace(/&/g, '-and-') // & -> 'and'
        .replace(/[^a-z0-9\-]/g, '-') // Geçersiz karakterleri '-' ile değiştir (boşluklar dahil)
        .replace(/-+/g, '-') // Çoklu '---' -> '-'
        .replace(/^-+/, '') // Başlangıçtaki '-' sil
        .replace(/-+$/, ''); // Sondaki '-' sil
}