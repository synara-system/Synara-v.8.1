// path: app/blog/[slug]/page.js

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

// --- DİNAMİK METADATA PROTOKOLÜ (SERVER-SIDE) ---

// TradingView URL'sinden resim URL'sini alan yardımcı fonksiyon (Metadata için)
const getUrlInfoMeta = (url) => {
    if (!url) return null;
    try {
        const urlObject = new URL(url);
        const snapshotMatch = urlObject.pathname.match(/^\/x\/([a-zA-Z0-9]+)/);
        if (snapshotMatch && snapshotMatch[1]) {
            const id = snapshotMatch[1];
            const firstLetter = id.charAt(0).toLowerCase();
            return {
                type: 'image',
                src: `https://s3.tradingview.com/snapshots/${firstLetter}/${id}.png`
            };
        }
    } catch (e) { return null; }
    return null;
};

export async function generateMetadata({ params }) {
    const data = await getPostBySlug(params.slug);
    const post = data?.post;
    const URL = getBaseUrl();
    
    if (!post) {
         // Eğer post bulunamazsa notFound() fonksiyonu Server Component tarafından çağrılır.
         // Metadata için varsayılan bir değer döndürülür.
        return {
            title: 'Yazı Bulunamadı | Synara System',
            description: 'Aradığınız blog yazısı bulunamadı veya silinmiş.',
        };
    }

    const T = translations.tr;
    const pageTitle = `${post.title} | ${T.nav_blog} | Synara System`; 
    // KRİTİK FİX 3: Summary alanı post objesinde yoksa content'in ilk 150 karakterini kullan
    const summary = post.summary || post.content?.substring(0, 150) || "Synara, Anchor bar kapanışında teyitli, repaint yapmayan sinyaller üretir; duygusal hataları sistematik disiplinle eleyerek tek karara indirger.";
    const pageDesc = summary.replace(/[#*`]/g, '').trim();

    const canonicalUrl = `${URL}/blog/${post.slug}`;
    const urlInfo = getUrlInfoMeta(post.bannerImageUrl || post.youtubeVideoId);
    const postImage = urlInfo?.src || `${URL}/og-image.png`;

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
            images: [{ url: postImage }],
            type: 'article',
            publishedTime: post.createdAt,
            modifiedTime: post.updatedAt || post.createdAt,
            authors: [post.authorName || 'Synara System'],
        },
        twitter: {
            card: 'summary_large_image',
            title: pageTitle,
            description: pageDesc,
            images: [postImage],
        },
    };
}
// ----------------------------------------------------


/**
 * Server Component (Sarmalayıcı)
 */
const BlogPostServerWrapper = async ({ params }) => {
    const T = translations.tr;
    
    // Veriyi sunucu tarafında çek
    const data = await getPostBySlug(params.slug);
    const post = data?.post;
    const comments = data?.comments || [];

    if (!post) {
        notFound();
    }
    
    // Breadcrumb Schema Markup (Burada tutulur)
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": T?.nav_home || "Anasayfa",
                "item": getBaseUrl(),
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": T?.nav_blog || "Blog",
                "item": `${getBaseUrl()}/blog`,
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": post.title,
            }
        ]
    };


    return (
        // KRİTİK FİX: Header ve Footer kaldırıldı. 
        // Background stilleri doğrudan sayfaya uygulandı.
        <div className="min-h-screen bg-[#111827] text-white py-12 px-4 relative">
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
            
            <BlogPostClient 
                initialPostData={data} 
                slug={params.slug} 
                T={T}
            />
        </div>
        // KRİTİK FİX: Header ve Footer kaldırıldı.
    );
};

export default BlogPostServerWrapper;
