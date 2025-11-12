// v1.0.1 - SEO REFACTOR
import { notFound, redirect } from 'next/navigation'; // Yönlendirme için eklendi
import { translations } from '@/data/translations';
import { getBaseUrl } from '@/lib/trpc/utils';
import nextDynamic from 'next/dynamic'; 
import { getPostData } from '@/lib/blog-server'; // getPostBySlug -> getPostData olarak değiştirildi
// KRİTİK FİX: Header ve Footer, layout.js'te sarıldığı için buradan kaldırıldı.

// KRİTİK NİHAİ FİX: Force dynamic rendering to bypass aggressive Vercel/CDN caching.
export const dynamic = 'force-dynamic';

// KRİTİK: Yeni Client Component'i dinamik olarak import ediyoruz.
const BlogPostClient = nextDynamic(() => import('@/components/blog/BlogPostClient'), { 
    ssr: false, // Server Side Rendering'i devre dışı bırakır.
    loading: () => (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
            <div className="loader"></div>
            <p className="mt-4 text-lg">Analiz Yükleniyor...</p>
        </div>
    ),
});

// --- P10.0 FİX: DİNAMİK METADATA PROTOKOLÜ (SUNUCU TARAFI) ---
// v1.0.1 - SEO REFACTOR
export async function generateMetadata({ params }) {
    const { slug } = params;
    
    // 1. Yeni ana fonksiyonu çağır
    const data = await getPostData(slug);

    // 2. Kontrol et: Veri yoksa, post yoksa VEYA bu bir yönlendirme ise metadata oluşturma.
    if (!data || !data.post || data.redirect) {
        // notFound() çağrısı burada generateMetadata'da da yapılmalı
        // ki Next.js bu slug için bir metadata oluşturmayı denemesin.
        return notFound();
    }

    // 3. Veriyi doğru ayrıştır (v1.0.0'daki bug düzeltildi)
    const { post } = data;
    const BASE_URL = getBaseUrl();
    
    // Açıklama: Yeni SEO alanlarını öncelikli kullan
    const postDescription = post.seoDescription || 
        (post.content?.substring(0, 160).replace(/<[^>]+>/g, '').trim() + '...') || 
        translations.tr.default_description;

    // OG Image: Yeni bannerImageUrl alanını kullan
    const ogImageUrl = post.bannerImageUrl || `${BASE_URL}/synara_og_image.png`;
    const postTitle = post.seoTitle || post.title; // Yeni seoTitle alanını kullan

    return {
        title: postTitle, // Dinamik Başlık
        description: postDescription, // Dinamik Açıklama
        
        // Dinamik OpenGraph (Sosyal Medya Paylaşımı)
        openGraph: {
            title: postTitle,
            description: postDescription,
            url: `${BASE_URL}/blog/${slug}`, // Bu makalenin tam URL'si
            type: 'article',
            publishedTime: post.createdAt, // v1.0.1 - (publishedAt -> createdAt)
            authors: [post.authorName || 'Synara System'],
            images: [
                {
                    url: ogImageUrl,
                    alt: post.title,
                },
            ],
        },
        
        // Dinamik Twitter Card
        twitter: {
            card: 'summary_large_image',
            title: postTitle,
            description: postDescription,
            images: [ogImageUrl],
        },
    };
}
// --- P10.0 FİX SONU ---


// --- TradingView URL'sinden resim URL'sini alan yardımcı fonksiyon (Metadata için) ---
// (Bu fonksiyon şu anda generateMetadata'da doğrudan kullanılmıyor,
// ancak 'post.coverImage' TradingView URL'si ise kullanılabilir.)
const getUrlInfoMeta = (url) => {
    try {
        if (!url || typeof url !== 'string') return null;
        if (url.startsWith('https://www.tradingview.com/x/')) {
            return {
                url: `${url}.png`,
                width: 1920, // Tahmini
                height: 1080 // Tahmini
            };
        }
        return { url, width: 1200, height: 630 }; // Standart OG
    } catch (e) {
        return null;
    }
};


// --- ANA SAYFA BİLEŞENİ (SERVER COMPONENT) ---
// v1.0.1 - SEO REFACTOR
export default async function BlogPostPage({ params }) {
    
    // 1. Yeni ana fonksiyonu çağır
    const data = await getPostData(params.slug);

    // 2. Senaryo 1 (404): Veri hiç bulunamadı.
    if (!data) {
        notFound();
    }

    // 3. Senaryo 2 (301 Yönlendirme): Veri bulundu AMA bu eski bir URL.
    // data.redirect objesi doluysa, kullanıcıyı kalıcı olarak yeni (temiz) slug'a yönlendir.
    if (data.redirect) {
        redirect(data.redirect.destination, data.redirect.permanent ? 'permanent' : 'push');
    }

    // 4. Senaryo 3 (Başarılı): Veri bulundu ve yönlendirme yok.
    // Veriyi doğru şekilde ayrıştır (v1.0.0'daki bug düzeltildi).
    const { post, comments } = data;

    // 5. Güvenlik kontrolü
    if (!post) {
        notFound();
    }

    // T (Çeviri) objesi (Sadece 'tr' kullandığımız için sabit)
    const T = translations.tr || {};
    const BASE_URL = getBaseUrl();

    // --- P10.0 FİX: ARTICLE JSON-LD (YAPISAL VERİ) ---
    // v1.0.1 - Alanlar güncellendi
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${BASE_URL}/blog/${params.slug}`
        },
        "headline": post.seoTitle || post.title, // Yeni alanı kullan
        "image": post.bannerImageUrl || `${BASE_URL}/synara_logo_hq.svg`, // Yeni alanı kullan
        "datePublished": post.createdAt, // v1.0.1 (publishedAt -> createdAt)
        "dateModified": post.updatedAt || post.createdAt, // Varsa güncelleme, yoksa yayınlanma
        "author": {
            "@type": "Organization", // Yazar "Kişi" (Person) değilse, "Kuruluş" (Organization)
            "name": post.authorName || "Synara System"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Synara System",
            "logo": {
                "@type": "ImageObject",
                "url": `${BASE_URL}/synara_logo_hq.svg`
            }
        },
        "description": post.seoDescription || post.content?.substring(0, 160).replace(/<[^>]+>/g, '').trim() + '...' // Yeni alanı kullan
    };
    // --- P10.0 FİX SONU ---

    // Mevcut Breadcrumb (Sayfa Haritası) JSON-LD (KORUNDU)
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Anasayfa",
                "item": BASE_URL,
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": T?.nav_blog || "Blog",
                "item": `${BASE_URL}/blog`,
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": post.title, // Dinamik başlık
            }
        ]
    };


    return (
        // KRİTİK FİX: Header ve Footer kaldırıldı. 
        // Background stilleri doğrudan sayfaya uygulandı.
        <div className="min-h-screen bg-[#111827] text-white py-12 px-4 relative">
            
             {/* P10.0 FİX: Article JSON-LD (Makale) EKLENDİ */}
             <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(articleSchema),
                }}
             />
             
             {/* Mevcut Breadcrumb JSON-LD (KORUNDU) */}
             <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbSchema),
                }}
             />

             {/* Arka plan efektleri Client Component'te değil, burada tutulmalıdır */}
            <div className="absolute inset-0 bg-grid-indigo-500/10 bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_center,transparent_0%,black_100%)]"></div>
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.1) 0%, rgba(17, 24, 39, 0) 70%)'
            }}></div>
            
            {/* --- v1.0.1 FİX (KÖK NEDEN) ---
                 HATA: <BlogPostClient post={post} T={T} />
                 İstemci bileşeni 'initialPostData' ve 'slug' bekliyordu.
                 
                 v1.0.1 DÜZELTME: Client'a artık sunucuda çözümlenmiş
                 { post, comments, redirect: null } objesinin tamamı 
                 'initialPostData' prop'u olarak gönderiliyor.
            */}
            <BlogPostClient 
                initialPostData={data} // DOĞRUSU: {post, comments, ...} objesini gönder
                slug={params.slug}     // DOĞRUSU: Eksik slug prop'u eklendi
                T={T}
            />
            {/* --- v1.0.1 FİX SONU --- */}
        </div>
    );
}