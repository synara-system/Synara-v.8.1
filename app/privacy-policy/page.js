// path: app/privacy-policy/page.js
import React from 'react';
import { translations } from '@/data/translations';
import Icon from '@/components/Icon';

// Next.js için sayfa meta verileri
export async function generateMetadata() {
    const T = translations.tr;
    return {
        title: `${T.footer_privacy} | Synara System`,
        description: "Synara System'in kullanıcı verilerini nasıl topladığı, kullandığı ve koruduğu hakkında bilgiler.",
    };
}

/**
 * Tüm yasal sayfalar için (Hizmet Şartları, Gizlilik Politikası) tekrar kullanilabilir layout bileşeni.
 * Not: Bu component, /app/terms-of-service/page.js ile paylaşılmıştır.
 */
const LegalPageLayout = ({ title, children }) => (
    <div className="min-h-screen bg-gray-900 text-white py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-4xl">
            {/* KRİTİK FİX: Shadow-2xl eklendi */}
            <div className="bg-gray-800/50 p-8 md:p-12 rounded-2xl border border-gray-700 shadow-2xl">
                <h1 className="text-3xl md:text-4xl font-bold text-indigo-400 mb-8 flex items-center">
                    <Icon name="shield-check" className="w-8 h-8 mr-4" />
                    {title}
                </h1>
                {/* prose-invert: Koyu modda metin renklerini tersine çevirir. */}
                <div className="prose prose-invert max-w-none text-gray-300 prose-headings:text-white prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

const PrivacyPolicyPage = () => {
    const T = translations.tr;

    return (
        <LegalPageLayout title={T.footer_privacy}>
            {/* KRİTİK DÜZELTME: Çeviri anahtarları translations.js dosyasından çekiliyor */}
            <p className="lead text-lg font-semibold mb-6">{T.privacy_policy_last_updated || "Son Güncelleme: [Tarih Tanımlanmadı]"}</p>
            
            <h2>1. {T.privacy_policy_title_1}</h2>
            <p>{T.privacy_policy_content_1}</p>

            <h2>2. {T.privacy_policy_title_2}</h2>
            <p>{T.privacy_policy_content_2}</p>

            <h2>3. {T.privacy_policy_title_3}</h2>
            <p>{T.privacy_policy_content_3}</p>

            <h2>4. {T.privacy_policy_title_4}</h2>
            <p>{T.privacy_policy_content_4}</p>

            <h2>5. {T.privacy_policy_title_5}</h2>
            <p>{T.privacy_policy_content_5}</p>

            <h2>6. {T.privacy_policy_title_6}</h2>
            <p>{T.privacy_policy_content_6}</p>

        </LegalPageLayout>
    );
};

export default PrivacyPolicyPage;
