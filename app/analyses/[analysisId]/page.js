// path: app/analyses/[analysisId]/page.js
import { notFound } from 'next/navigation';
import { translations } from '@/data/translations';
import { getBaseUrl } from '@/lib/trpc/utils';
import dynamic from 'next/dynamic';

// KRİTİK FİX: Next.js'in Global CDN önbelleğini tamamen bypass etmek için
// Bu sayfayı Server-Side-Rendered (SSR) olarak zorla.
export const dynamic = 'force-dynamic';

// KRİTİK: Client Component'i dinamik olarak import ediyoruz.
// Bu, Next.js'e bu kısmın Client tarafında çalışacağını bildirir.
const AnalysesClient = dynamic(() => import('./AnalysesClient.js'), {
    ssr: false, // Server Side Rendering'i devre dışı bırakır.
    loading: () => (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
            <div className="loader"></div>
            <p className="mt-4 text-lg">Analiz Yükleniyor...</p>
        </div>
    ),
});

// --- DİNAMİK METADATA PROTOKOLÜ (SERVER-SIDE) ---
// Bu fonksiyon, Server Component'te çalışarak SEO sağlar.

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
    const analysisId = params.analysisId;
    const T = translations.tr; 
    const URL = getBaseUrl();
    
    // NOT: Gerçek veriye erişim simülasyonu için placeholder kullanıldı.
    // Canlı sistemde bu kısım Admin SDK ile veriyi çekmelidir.
    
    const pageTitle = `Analiz Detayı (${analysisId}) | Synara System`;
    const fixedDescription = "Synara, Anchor bar kapanışında teyitli, repaint yapmayan sinyaller üretir; duygusal hataları sistematik disiplinle eleyerek tek karara indirger.";

    const imageUrl = `${URL}/images/default-analysis.jpg`;

    return {
        title: pageTitle,
        description: fixedDescription,
        alternates: {
            canonical: `${URL}/analyses/${analysisId}`,
        },
        openGraph: {
            title: pageTitle,
            description: fixedDescription,
            url: `${URL}/analyses/${analysisId}`,
            images: [{ url: imageUrl }],
        },
    };
}
// ----------------------------------------------------


/**
 * Server Component (Sarmalayıcı)
 */
const AnalysisServerWrapper = ({ params }) => {
    const { analysisId } = params;

    // Client Component'e sadece gerekli parametreleri aktarır.
    return (
        <AnalysesClient analysisId={analysisId} />
    );
};

export default AnalysisServerWrapper;
