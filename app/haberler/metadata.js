// path: app/haberler/metadata.js
import { translations } from '@/data/translations';
// P12.0 FİX: Dinamik URL oluşturmak için getBaseUrl import edildi.
import { getBaseUrl } from '@/lib/trpc/utils';

/**
 * Server Component'te SEO için metadata fonksiyonu kullanılır.
 * Bu dosya, Client Component olan page.js'ten generateMetadata'yı ayırmak için oluşturulmuştur.
 * * P12.0 FİX: Hardcoded (sabit) URL'ler dinamik hale getirildi ve OG imajı
 * placeholder yerine global imajla değiştirildi.
 */
export async function generateMetadata() {
    const T = translations.tr; 
    
    // P12.0 FİX: BASE_URL dinamik olarak alınmalı.
    const BASE_URL = getBaseUrl();
    
    const pageTitle = `${T.nav_news} | Synara System`; 
    const pageDesc = T.news_page_subtitle;
    
    // P12.0 FİX: URL dinamik hale getirildi.
    // HATA: const canonicalUrl = "https://synarasystem.com/haberler";
    const canonicalUrl = `${BASE_URL}/haberler`;
    
    // P12.0 FİX: İmaj, global OG imajı ile değiştirildi.
    // HATA: const uleImage = "https://placehold.co/1200x630/111827/EF4444?text=SYNARA+HABER+PROTOKOLU";
    const ogImageUrl = `${BASE_URL}/synara_og_image.png`;
    
    return {
        title: pageTitle,
        description: pageDesc,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: pageTitle,
            description: pageDesc,
            url: canonicalUrl,
            images: [{ url: ogImageUrl, alt: pageTitle }], // P12.0 FİX
        },
        twitter: {
            card: 'summary_large_image',
            title: pageTitle,
            description: pageDesc,
            images: [ogImageUrl], // P12.0 FİX
        },
    };
}
