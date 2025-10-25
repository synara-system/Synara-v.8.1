// path: app/blog/[slug]/page.js
import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link'; 
import { translations } from '@/data/translations';
import SkeletonLoader from '@/components/SkeletonLoader';
import { getPostBySlug, getAllPostSlugs } from '@/lib/blog-server';
import { marked } from 'marked'; 
import BlogArticle from '@/components/blog/BlogArticle'; 
import BlogInteractions from '@/components/blog/BlogInteractions'; 
import Icon from '@/components/Icon'; 
import { getBaseUrl } from '@/lib/trpc/utils'; 
import Header from '@/components/Header'; // Header added for consistency
import Footer from '@/components/Footer'; // Footer added for consistency

// KRİTİK NİHAİ FİX: Force dynamic rendering to bypass aggressive Vercel/CDN caching.
// This ensures that updates from the admin panel appear instantly.
export const dynamic = 'force-dynamic';
// Note: revalidate setting is unnecessary when dynamic = 'force-dynamic' is used.

// Utility function to calculate reading time (simplified)
const calculateReadingTime = (content) => {
    if (!content) return 0;
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
};


// Function to generate dynamic metadata for SEO
export async function generateMetadata({ params }) {
    const data = await getPostBySlug(params.slug);
    const post = data?.post;
    const URL = getBaseUrl();

    if (!post) {
        return {
            title: 'Yazı Bulunamadı | Synara System',
            description: 'Aradığınız blog yazısı bulunamadı veya silinmiş.',
        };
    }

    const T = translations.tr;
    const pageTitle = `${post.title} | ${T.nav_blog} | Synara System`; 
    const pageDesc = post.summary;
    const canonicalUrl = `${URL}/blog/${post.slug}`;
    const postImage = post.bannerImageUrl || post.imageUrl || "https://placehold.co/1200x630/111827/4F46E5?text=SYNARA+ANALIZLER";

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


// The main component for the blog post page
const BlogPostPage = async ({ params }) => {
    const T = translations.tr;
    
    // Fetch post data and comments from server
    const data = await getPostBySlug(params.slug);
    const post = data?.post;
    const comments = data?.comments || [];
    
    if (!post) {
        notFound();
    }
    
    const readingTime = calculateReadingTime(post.content);
    const formattedDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : T.date_unknown;

    // Convert Markdown to HTML
    const postWithHtml = {
        ...post,
        contentHtml: marked.parse(post.content || ''),
    };

    // Schema Markup (Breadcrumb)
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
        <>
            <Header T={T} />
            <div className="min-h-screen bg-[#111827] text-white py-12 px-4">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(breadcrumbSchema),
                    }}
                />
                
                 <div className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
                     
                     {/* 1. Kısım: Makale İçeriği (Server Rendered) */}
                     <div className="lg:col-span-2 order-1 space-y-8">
                         
                         {/* KRİTİK METRİKLER VE BAŞLIK BÖLÜMÜ - YENİDEN EKLENDİ */}
                         <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-indigo-400">
                             {post.title}
                         </h1>
                         <p className="text-lg text-gray-400 italic mb-6">
                             {post.summary}
                         </p>

                         {/* YAZAR, TARİH VE OKUMA SÜRESİ METRİKLERİ */}
                         <div className="flex items-center space-x-6 text-sm text-gray-400 border-b border-gray-700 pb-4 mb-4">
                             <div className="flex items-center space-x-2">
                                 <Icon name="user-circle" className="w-5 h-5 text-indigo-500" />
                                 <span>{post.authorName || T.author_default}</span>
                             </div>
                             <div className="flex items-center space-x-2">
                                 <Icon name="calendar" className="w-5 h-5 text-indigo-500" />
                                 <span>{formattedDate}</span>
                             </div>
                             <div className="flex items-center space-x-2">
                                 <Icon name="clock" className="w-5 h-5 text-indigo-500" />
                                 <span>{readingTime} {T.min_read || 'dk Okuma'}</span>
                             </div>
                             {/* Görüntülenme sayısı eklendi */}
                             <div className="flex items-center space-x-2">
                                 <Icon name="eye" className="w-5 h-5 text-indigo-500" />
                                 <span>{post.viewCount || 0} {T.views || 'Görüntüleme'}</span>
                             </div>
                         </div>
                         {/* Geri Dön Linki */}
                         <div className="mb-8 flex justify-between items-center">
                            <Link href="/blog" className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center">
                                <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                                {T?.nav_back_to_blog || "Tüm Yazılara Geri Dön"}
                            </Link>
                         </div>
                         
                         <BlogArticle post={postWithHtml} T={T} />
                     </div>
                     
                     {/* 2. Kısım: Etkileşimler (Client Rendered / Sticky) */}
                     <BlogInteractions
                        postId={post.id}
                        postSlug={post.slug}
                        postTitle={post.title}
                        initialLikes={post.likes}
                        initialComments={comments}
                        T={T}
                     />
                     
                 </div>
            </div>
            <Footer T={T} />
        </>
    );
};

export default BlogPostPage;
