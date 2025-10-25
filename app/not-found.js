import React from 'react';
import Link from 'next/link';
// next/navigation kancası App Router'da useRouter'a alternatif olarak kullanılır
// Ancak bu sayfada sadece Link kullanıldığı için ekstra bir kanca gerekmiyor.
import Icon from '@/components/Icon'; 

// Basit fallback metinler
const T_404 = {
    title: "404 - Sayfa Bulunamadı | Synara System",
    heading: "404 - Sayfa Bulunamadı",
    message: "Aradığınız adres mevcut değil, kaldırılmış veya yanlış yazılmış olabilir.",
    go_home: "Ana Sayfaya Dön",
    go_blog: "Blog Yazılarına Göz At",
};

/**
 * App Router'da Next.js'in özel not-found.js dosyasıdır.
 * Bu dosyanın içinde <Head> veya metadata tanımlanmasına gerek yoktur.
 */
const Custom404 = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
        {/* Head tag'leri app/layout.js'e taşındı. */}

        <div className="text-center p-8 bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl max-w-xl w-full">
            <Icon name="alert-triangle" className="w-16 h-16 text-red-500 mx-auto mb-6" />

            <h1 className="text-6xl font-extrabold text-indigo-400 mb-2">404</h1>
            <h2 className="text-3xl font-bold mb-4">{T_404.heading}</h2>
            <p className="text-gray-400 mb-10 leading-relaxed">{T_404.message}</p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                    href="/" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center min-w-[200px]"
                >
                    <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                    {T_404.go_home}
                </Link>
                 <Link 
                    href="/blog" 
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center min-w-[200px]"
                >
                    <Icon name="align-left" className="w-4 h-4 mr-2" />
                    {T_404.go_blog}
                </Link>
            </div>
        </div>

    </div>
  );
};

export default Custom404;
