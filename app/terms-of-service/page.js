import React from 'react';
// Uygulama genelindeki çeviri metinlerini alıyoruz
import { translations } from '@/data/translations';
// Ortak kullanılan icon bileşeni
import Icon from '@/components/Icon';

// Next.js için sayfa meta verileri
export async function generateMetadata() {
    const T = translations.tr;
    // 'footer_terms' key'i büyük ihtimalle uygulamanın tamamında tanimlidir.
    const title = T.footer_terms || "Hizmet Şartları"; 
    return {
        title: `${title} | Synara System`,
        description: "Synara System hizmetlerinin kullanımıyla ilgili yasal şartlar ve koşullar.",
    };
}

/**
 * Tüm yasal sayfalar için (Hizmet Şartları, Gizlilik Politikası) tekrar kullanilabilir layout bileşeni.
 */
const LegalPageLayout = ({ title, children }) => (
    <div className="min-h-screen bg-gray-900 text-white py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-4xl">
            <div className="bg-gray-800/50 p-8 md:p-12 rounded-2xl border border-gray-700 shadow-2xl">
                <h1 className="text-3xl md:text-4xl font-bold text-indigo-400 mb-8 flex items-center">
                    <Icon name="shield-check" className="w-8 h-8 mr-4" />
                    {title}
                </h1>
                {/* prose-invert: Koyu modda metin renklerini tersine çevirir.
                  prose-headings: Başlık renklerini özelleştirir.
                  prose-a: Link renklerini özelleştirir.
                */}
                <div className="prose prose-invert max-w-none text-gray-300 prose-headings:text-white prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

/**
 * Hizmet Şartları Sayfası ana bileşeni.
 */
const TermsOfServicePage = () => {
    // Türkçe çevirileri T kisa adiyla aliyoruz
    const T = translations.tr;
    // Başlık için T.footer_terms'ü kullaniyoruz, tanimli degilse "Hizmet Şartları"
    const title = T.footer_terms || "Hizmet Şartları";

    return (
        <LegalPageLayout title={title}>
            <p className="lead text-lg font-semibold mb-6">{T.terms_last_updated}</p>
            
            <h2>1. {T.terms_section1_title}</h2>
            <p>{T.terms_section1_content}</p>

            <h2>2. {T.terms_section2_title}</h2>
            <p>{T.terms_section2_content}</p>

            <h2>3. {T.terms_section3_title}</h2>
            <p>{T.terms_section3_content}</p>

            <h2>4. {T.terms_section4_title}</h2>
            <p>{T.terms_section4_content}</p>
            
            <h2>5. {T.terms_section5_title}</h2>
            <p>{T.terms_section5_content}</p>

            <h2>6. {T.terms_section6_title}</h2>
            <p>{T.terms_section6_content}</p>

            <h2>7. {T.terms_section7_title}</h2>
            <p>{T.terms_section7_content}</p>

            <h2>8. {T.terms_section8_title}</h2>
            <p>{T.terms_section8_content}</p>

        </LegalPageLayout>
    );
};

export default TermsOfServicePage;
