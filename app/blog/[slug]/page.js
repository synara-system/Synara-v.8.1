// path:app/blog/[slug]/page.js

import { notFound } from 'next/navigation';
import { translations } from '@/data/translations';
import { getBaseUrl } from '@/lib/trpc/utils';
import nextDynamic from 'next/dynamic'; 
import { getPostBySlug } from '@/lib/blog-server';
// KRİTİK FİX: Header ve Footer, layout.js'te sarıldığı için buradan kaldırıldı.
// import Header from '@/components/Header';
// import Footer from '@/components/Footer';

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
export async function generateMetadata({ params }) {
    const { slug } = params;
    const post = await getPostBySlug(slug);

    if (!post) {
        // notFound() çağrısı burada generateMetadata'da da yapılmalı
        // ki Next.js bu slug için bir metadata oluşturmayı denemesin.
        return notFound();
    }

    const BASE_URL = getBaseUrl();
    
    // Açıklama: Ya 'excerpt' (özet) alanını kullan, 
    // ya da içeriğin ilk 160 karakterini al.
    const postDescription = post.excerpt 
        ? post.excerpt 
        : (post.content?.substring(0, 160) + '...' || translations.tr.default_description); // fallback

    // OG Image: Ya 'coverImage' (kapak resmi) alanını kullan,
    // ya da global OG resmini kullan.
    const ogImageUrl = post.coverImage || `${BASE_URL}/synara_og_image.png`;

    return {
        title: post.title, // Dinamik Başlık
        description: postDescription, // Dinamik Açıklama
        
        // Dinamik OpenGraph (Sosyal Medya Paylaşımı)
        openGraph: {
            title: post.title,
            description: postDescription,
            url: `${BASE_URL}/blog/${slug}`, // Bu makalenin tam URL'si
            type: 'article',
            publishedTime: post.publishedAt, // Yayınlanma tarihi (ISO string olmalı)
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
            title: post.title,
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
export default async function BlogPostPage({ params }) {
    const post = await getPostBySlug(params.slug);

    if (!post) {
        notFound();
    }

    // T (Çeviri) objesi (Sadece 'tr' kullandığımız için sabit)
    const T = translations.tr || {};
    const BASE_URL = getBaseUrl();

    // --- P10.0 FİX: ARTICLE JSON-LD (YAPISAL VERİ) ---
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${BASE_URL}/blog/${params.slug}`
        },
        "headline": post.title,
        "image": post.coverImage || `${BASE_URL}/synara_logo_hq.svg`, // Kapak resmi veya logo
        "datePublished": post.publishedAt, // ISO String formatında olmalı
        "dateModified": post.updatedAt || post.publishedAt, // Varsa güncelleme, yoksa yayınlanma
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
        "description": post.excerpt || post.content?.substring(0, 160) + '...' // Meta description ile aynı
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
            
            {/* --- P11.0 FİX (KÖK NEDEN) ---
                HATA: <BlogPostClient post={post} T={T} />
                İstemci bileşeni 'initialPostData' ve 'slug' bekliyordu.
                Bu prop uyuşmazlığı, sayfanın 'loading' spinner'ında kilitlenmesine neden oluyordu.
            */}
            <BlogPostClient 
                initialPostData={post} // DOĞRUSU: Prop adı düzeltildi
                slug={params.slug}       // DOĞRUSU: Eksik slug prop'u eklendi
                T={T}
            />
            {/* --- P11.0 FİX SONU --- */}
        </div>
    );
}

