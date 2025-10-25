// path: app/privacy-policy/page.js
import React from 'react';
import { translations } from '@/data/translations';
import Icon from '@/components/Icon';

export async function generateMetadata() {
    const T = translations.tr;
    return {
        title: `${T.footer_privacy} | Synara System`,
        description: "Synara System'in kullanıcı verilerini nasıl topladığı, kullandığı ve koruduğu hakkında bilgiler.",
    };
}

const LegalPageLayout = ({ title, children }) => (
    <div className="min-h-screen bg-gray-900 text-white py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-4xl">
            <div className="bg-gray-800/50 p-8 md:p-12 rounded-2xl border border-gray-700">
                <h1 className="text-3xl md:text-4xl font-bold text-indigo-400 mb-8 flex items-center">
                    <Icon name="shield-check" className="w-8 h-8 mr-4" />
                    {title}
                </h1>
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
            <p className="lead">{T.privacy_last_updated}</p>
            
            <h2>1. {T.privacy_section1_title}</h2>
            <p>{T.privacy_section1_content}</p>

            <h2>2. {T.privacy_section2_title}</h2>
            <p>{T.privacy_section2_content}</p>

            <h2>3. {T.privacy_section3_title}</h2>
            <p>{T.privacy_section3_content}</p>

            <h2>4. {T.privacy_section4_title}</h2>
            <p>{T.privacy_section4_content}</p>

            <h2>5. {T.privacy_section5_title}</h2>
            <p>{T.privacy_section5_content}</p>
        </LegalPageLayout>
    );
};

export default PrivacyPolicyPage;
