// path: data/mesteg-content.js

// Mesteg Referans sayfası için tüm metinsel ve yapısal verileri içerir.
// Bu dosya, sayfanın içeriğinin yönetimini (araştırma metinleri, istatistikler, vb.)
// ana bileşenden (page.js) ayırarak kodu sadeleştirir.

export const MESTEG_CONTENT = {
    metadata: {
        title: "Mesteg Teknoloji | Synara System Güvencesi - Yapısal Disiplin Protokolü", 
        description: "Synara System'in arkasındaki teknik altyapı ve kurumsal güvenceyi sağlayan Mesteg Teknoloji'nin Yapısal Disiplin Protokolünü inceleyin. Repaint-free garantisi ve mikrosaniye performans sunar. Next.js 13 ve tRPC tabanlı güvenilir platform.",
    },
    hero: {
        title: "MESTEG PROTOKOLÜ: Yapısal Disiplin Merkezi", 
        subtitle: "Sistem, Gürültüden Korunur. Karar, Mühürlenir.", 
        description: "Synara, finansal piyasalarda veri odaklı ve disiplinli karar alma imkânı sunan, ileri teknolojiyle geliştirilmiş bir platformdur. Bu sayfa, Synara System'in altyapısını oluşturan yazılım mimarisi, entegrasyonlar ve teknik özellikler hakkında, hem teknik ekiplerin hem de stratejik karar vericilerin beklentilerini karşılayacak seviyede, sade ama kapsamlı bilgiler sunar. **Mesteg Teknoloji**'nin bu sağlam altyapısı sayesinde, Synara kağıt üstünde değil, sahada çalışan bir düzenin ürünüdür.",
        logoAlt: "Mesteg Teknoloji ve Synara System Logosu"
    },
    stats: [
        { label: "Ortalama İşlem Hızı", value: "8 ms", unit: "s", description: "Veri alımı ve sinyal üretimi arasındaki kritik gecikme süresi (End-to-End Latency)." },
        { label: "Hata Toleransı", value: "99.998%", unit: "", description: "Yıllık kesintisiz hizmet taahhüdü ve otomatik hata kurtarma oranı (N+1 Yedekli Yapı)." },
        { label: "Maksimum Eşzamanlı Yük", value: "500K+", unit: "", description: "Yüksek hacimli ve eşzamanlı aktif kullanıcı kapasitesi (Dağıtık mimari garantisi)." }
    ],
    sections: [ 
        { 
            id: "nextjs-app-router",
            title: "1. Next.js App Router ile Modern Web Mimarisi", 
            icon: 'layout-grid',
            tag: 'MİMARİ',
            content: `**MİMARİ PRENSİBİ: Sunucu Odaklı Hız (Server-First Velocity)**

Synara System, Next.js 13'ün App Router mimarisi üzerinde inşa edilmiştir. App Router sayesinde proje, dosya bazlı yönlendirme ve React Server Components (RSC) gibi en yeni React özelliklerinden yararlanır. Bu mimari, sistemin bütünsel zekâ felsefesini dijital ortama taşıyan, performanslı, güvenli ve kullanıcı odaklı bir altyapının temelini oluşturur.

- **Sunucu Bileşenleri (RSC):** Varsayılan olarak tüm arayüz bileşenleri sunucu tarafında çalıştırılır (SSR). Bu sayede veri işleme sunucuya yakın konumda yapılır ve istemciye gönderilen JavaScript miktarı ciddi oranda azaltılır.
- **Minimum JS Yükü:** Yalnızca kullanıcı etkileşimi gerektiren kısımlar ('use client' yönergesi ile) istemciye gönderilir (Client Components). Bu, ilk sayfa yükleme süresini kısaltarak yüksek Lighthouse skorlarını garanti eder.
- **Performans Optimizasyonu:** Bileşenlerin büyük kısmı (istatistik gösterimleri, içerik listeleri vb.) sunucu tarafında oluşturulduğu için tarayıcıda yeniden boyama (repaint) minimuma iner ve kullanıcı anında tam içerik görür.
- **SEO ve Erişilebilirlik:** UI'nin büyük bölümü SSR ile geldiği için arama motorları (Crawler) sayfanın tam içeriğini hatasız indeksler, bu da SEO dostu bir yapı sunar.
- **Dosya Bazlı Yönlendirme:** Uygulama, dosya sistemine dayalı, kolay yönetilebilir ve ölçeklenebilir bir yönlendirme yapısına sahiptir.`,
        },
        { 
            id: "tailwind-css",
            title: "2. Tailwind CSS ve Kurumsal Tasarım Protokolü", 
            icon: 'paint-brush',
            tag: 'TASARIM',
            content: `**TASARIM PRENSİBİ: Utility-First Disiplini (The Utility-First Discipline)**

Arayüz katmanında Tailwind CSS'in utility-first yaklaşımı benimsenmiştir. Bu, stil oluşturmada hızı, kodun temizliğini ve sistem genelindeki görsel tutarlılığı garanti eder. Arayüzün geliştirilmesi, bileşenlerin hızlı bir şekilde birleştirilmesi üzerine kurulmuştur; bu sayede tasarım değişiklikleri minimum çabayla uygulanabilir.

- **Görsel Tutarlılık:** Şirketimizin kurumsal renk paleti (Pembe/Sarı Neon protokolü dahil) ve boşluk ayarları (spacing) proje genelinde mutlak bir tutarlılıkla, önceden tanımlanmış Tailwind sınıfları üzerinden uygulanır.
- **Duyarlı ve Esnek Tasarım:** Tailwind'in güçlü ve esnek grid sistemi ve mobil öncelikli yaklaşımla tüm paneller, raporlar ve sayfalar mobil, tablet ve masaüstü cihazlarda optimal ve kesintisiz görünüm sağlar.
- **Minimal ve Hızlı CSS:** JIT (Just-In-Time) derleyici, yalnızca HTML/JSX içinde kullanılan stil sınıflarını derler ve final CSS dosya boyutunu milisaniyelere indirir, bu da Lighthouse performansını artırır.
- **Dinamik Sınıflar:** Modüller arası renk geçişleri (örneğin Nexus yeşil, Metis sarı) gibi dinamik üretilen sınıflar, üretim ortamında yanlışlıkla silinmemesi için \`tailwind.config.js\` içindeki özel \`safelist\` (izin listesi) kullanılarak korunur.
- **Karanlık Mod:** Kullanıcıların uzun süreli kullanımlarda göz yorgunluğunu azaltmak için karanlık mod (\`darkMode: "class"\`) desteği tam olarak entegre edilmiştir.`,
        },
        { 
            id: "trpc-firebase",
            title: "3. tRPC ve Firebase: Uçtan Uca Tip Güvenliği ve Yetkilendirme", 
            icon: 'server',
            tag: 'BACKEND & GÜVENLİK',
            content: `**GÜVENLİK PRENSİBİ: Teyitli Veri Akışı (Validated Data Flow)**

Sistemin arka uç iletişimi, tRPC (TypeScript Remote Procedure Call) ile Firebase'in ölçeklenebilir ve güvenli kombinasyonuna dayanır. Bu mimari, veri tutarlılığını ve güvenliğini en üst seviyeye taşır, istemci-sunucu arasındaki iletişimdeki belirsizlikleri ortadan kaldırır.

- **Uçtan Uca Tip Güvenliği:** tRPC, istemci ve sunucu arasındaki tüm API çağrılarında veri yapılarının tiplerini (TypeScript) derleme zamanında kontrol eder. Bu sayede, hataların çoğu kod yazılırken yakalanır ve runtime hataları engellenir.
- **Firebase Yetkilendirme (Auth):** Gelen her tRPC isteği, \`Firebase Admin SDK\` kullanılarak Firebase ID Token'ı üzerinden kesinlikle doğrulanır (\`Authorization: Bearer <token>\` başlığı ile). Token'ın geçerliliği ve süresi anlık olarak kontrol edilir.
- **Rol Tabanlı Erişim:** Tüm sunucu prosedürleri (Procedure) erişim seviyelerine göre ayrılmıştır: \`publicProcedure\` (herkese açık), \`protectedProcedure\` (oturum açmış üye zorunlu) ve \`adminProcedure\` (yönetici zorunlu). Admin yetkisi, hem token'daki özel \`claim\` hem de Firestore'daki kullanıcı kaydı üzerinden çift kontrol edilerek güvenlik sağlanır.
- **Firestore Veri Depolama:** Kullanıcı verileri, performans metrikleri, kasa kayıtları ve diğer dinamik içerikler Google Cloud'un ölçeklenebilir ve gerçek zamanlı veritabanı olan Firestore'da tutulur.`,
        },
        { 
            id: "ai-protocol",
            title: "4. Yapay Zeka Entegrasyon Protokolü (Gemini API)", 
            icon: 'cpu',
            tag: 'TEKNOLOJİ',
            content: `**AKILLI PROTOKOL: HIM (Holistic Intelligence Matrix) Desteği**

Synara Engine, kullanıcıya bütünsel zeka protokolü ve kişisel performans verileri hakkında bilgi sunan gelişmiş bir AI asistanına sahiptir. Bu entegrasyon, Yapay Zeka'nın karar destek süreçlerine dahil edilmesini sağlar.

- **Özel AI Router:** Sunucu tarafında özel bir \`ai router\` bulunur. Bu router, ön tanımlı ve sıkı komutlar (\`system prompts\`) kullanarak harici Yapay Zeka servisine (Google Generative Language API) istek gönderir. Kullanıcının sorgusu, bu sistem komutları ile filtrelenir ve yönlendirilir.
- **Güvenlik ve Gizlilik:** Yapay zeka API anahtarı (\`GEMINI_API_KEY\`) mutlak suretle sadece sunucu tarafında (\`.env.local\` dosyası ile) saklanır ve istemciye herhangi bir şekilde ifşa edilmesi engellenir.
- **Kararlılık ve Güvenilirlik:** Harici API çağrıları için 3 adede kadar \`retry\` (tekrar deneme) ve mantıksal \`timeout\` (zaman aşımı) mekanizmaları uygulanarak dış hizmet bağımlılığındaki olası kararsızlıklar yönetilir.
- **Bağlamsal Yanıt:** Asistan, kullanıcının Kasa Yönetimi verilerini (Win Rate, Ortalama R:R, PnL vb.) **bağlam** (\`context\`) olarak kullanarak kişiselleştirilmiş disiplin ve strateji önerileri sunar. Bu, generic yanıtların önüne geçer.`,
        },
        { 
            id: "performance-protocol",
            title: "5. Performans ve Görsel Optimizasyon (Lighthouse & next/image)", 
            icon: 'image',
            tag: 'PERFORMANS',
            content: `**HIZ PRENSİBİ: Mikrosaniye Performans (Microsecond Performance)**

Kullanıcı deneyimini maksimize etmek ve Core Web Vitals metriklerinde yüksek skor elde etmek Synara'nın temel hedeflerindendir. Next.js'in yerleşik performans özellikleri agresif bir şekilde kullanılmıştır.

- **Görüntü Optimizasyonu:** \`next/image\` bileşeni kullanılarak tüm görseller otomatik olarak cihaz boyutuna uygun, WebP/AVIF gibi modern formatlarda ve tembel yükleme (\`lazy-load\`) ile sunulur. Bu, CLS (Cumulative Layout Shift) ve LCP (Largest Contentful Paint) metriklerini iyileştirir.
- **Uzak Kaynak Yönetimi:** TradingView grafikleri, YouTube görselleri ve kullanıcı avatarları gibi harici domain'ler, \`next.config.js\` içindeki \`remotePatterns\` ile kesinlikle beyaz listeye alınmış ve güvenilirliği kanıtlanmıştır.
- **CSS ve Kod Bölme:** Tailwind JIT derleyicisi ve kod bölme (\`code-splitting\`) teknikleri sayesinde sadece gereken CSS ve JavaScript yüklenir, bu da sayfa kaynak boyutunu minimumda tutar.
- **Güvenlik Başlıkları:** \`Strict-Transport-Security\` (HSTS) ve diğer kritik güvenlik başlıkları (X-Frame-Options, Permissions-Policy), Next.js'in \`headers()\` fonksiyonu ile yapılandırılarak tarayıcı güvenliği ve uyumluluğu artırılır.`,
        },
        { 
            id: "seo-analytics",
            title: "6. Arama Motoru Optimizasyonu (SEO) ve Yapısal Veri", 
            icon: 'search',
            tag: 'PAZARLAMA',
            content: `**GÖRÜNÜRLÜK PRENSİBİ: Kapsamlı Keşif (Holistic Discoverability)**

Synara, yalnızca içerik kalitesiyle değil, arama motorlarında maksimum görünürlük için de tasarlanmıştır. Pazarlama ve teknik ekiplerin ortak hedefleri doğrultusunda, arama sonuçlarında üst sıralarda yer alma ve zengin snippet (Rich Snippet) gösterme yeteneğine sahiptir.

- **Dinamik Sitemap:** Tüm sayfaları, blog yazılarını ve dinamik analizleri listeleyen \`sitemap.xml\` dosyası, Next.js \`Route Handler\` ile dinamik olarak üretilir ve içerik güncellemeleri ile otomatik senkronize edilir.
- **Kanonik URL'ler:** Tüm sayfalar, arama motorlarının kopya içerik cezalarını önlemek için doğru \`canonical link\` etiketine sahiptir.
- **Yapılandırılmış Veri (JSON-LD):** Organizasyon, WebSite ve FAQPage şemaları kullanılarak arama motorlarına zengin bağlamsal bilgi sunulur, bu da arama sonuçlarında daha çekici gösterim sağlar.
- **Metadata API:** Başlık, açıklama ve sosyal medya görselleri (\`og:image\`) Next.js Metadata API ile dinamik olarak her sayfa için oluşturulur ve Open Graph uyumluluğu sağlanır.
- **Semantik ve Erişilebilir HTML:** Doğru başlık hiyerarşisi (\`H1-H2-H3\`) ve semantik etiketler (\`<main>\`, \`<footer>\`) kullanılarak erişilebilirlik (A11y) ve SEO skoru artırılır.`,
        },
        { 
            id: "deployment-pipeline",
            title: "7. Yayın Süreci ve CI/CD Protokolü", 
            icon: 'git-branch',
            tag: 'SÜRDÜRÜLEBİLİRLİK',
            content: `**OPERASYON PRENSİBİ: Kesintisiz Dağıtım (Zero-Downtime Deployment)**

Geliştirme, test ve yayın süreçleri, GitHub ve Vercel platformları üzerinden tam otomatik hale getirilmiştir. Bu, hızlı iterasyon ve güvenilir güncellemeleri mümkün kılar.

- **GitHub & Vercel Entegrasyonu:** Kod değişiklikleri bir \`git push\` ile Vercel'a otomatik olarak gönderilir ve dağıtım süreci başlatılır.
- **Önizleme Dağıtımı:** Her yeni özellik dalı (feature branch) için otomatik bir Önizleme URL'si (\`preview deployment\`) oluşturulur. Bu sayede QA, test ve paydaş incelemeleri canlı ortama zarar vermeden güvenle tamamlanır.
- **Kesintisiz Üretime Geçiş:** Vercel'ın \`zero-downtime deploy\` özelliği sayesinde yeni sürüm yayına alınırken kullanıcılar hizmet aksaması yaşamaz, her zaman kararlı sürüme erişirler.
- **Test Otomasyonu:** Yeni koda birleştirilmeden önce birim testleri (Jest) ve entegrasyon testleri, CI (Continuous Integration) sürecinde zorunlu olarak çalıştırılır.
- **Dinamik İçerik Güncelleme:** İçerik güncellemeleri (\`blog\` veya \`analyses\` gibi dinamik içerikler) sonrası \`/api/revalidate\` rotası güvenli bir şekilde tetiklenerek statik önbellek anında ve hedefe yönelik olarak temizlenir.`,
        },
        { 
            id: "monitoring-logging",
            title: "8. Loglama ve Gözetim Protokolü (Monitoring & Logging)", 
            icon: 'activity',
            tag: 'OPERASYON',
            content: `**İZLEME PRENSİBİ: Şeffaf Denetim (Transparent Oversight)**

Sistemin kararlılığını ve performansını korumak için, oluşabilecek her türlü duruma karşı proaktif bir loglama ve izleme altyapısı mevcuttur. Bu, kurumsal müşteriler için platformun şeffaf, güvenilir ve yönetilebilir olduğunu gösteren önemli bir göstergedir.

- **Yapılandırılmış Loglama:** Özel bir \`Logger\` sınıfı kullanılarak tüm kritik hatalar, uyarılar ve önemli kullanıcı eylemleri (\`login\`, \`trade submit\`) yapılandırılmış formatta (\`structured logging\`) kaydedilir. Loglama stratejisi yalnızca hataları değil, önemli kullanıcı işlemlerini de kapsar.
- **İşlem Logları:** Kullanıcı bir abonelik satın aldığında veya iptal ettiğinde, ilgili eylem ID'leriyle birlikte loglanır. Bu tür işlem logları, ileride çıkabilecek müşteri hizmetleri taleplerinde veya olası suistimal incelemelerinde değerli olacaktır.
- **Hata Sınırı (ErrorBoundary):** React component ağacındaki kritik istemci hataları yakalanır, loglanır ve kullanıcıya dostça bir arayüz gösterilirken, uygulamanın çökmesi engellenir.
- **Proaktif Uyarı Sistemi:** Kritik bir sunucu hatası oluştuğunda veya yapay zeka servisinden ardı ardına hatalar alındığında, sistem yöneticilerine e-posta veya chat yolu ile uyarı gönderilir. Bu sayede olası kesintilere anında müdahale edilerek kesintisiz hizmet sağlanır.
- **Veri Saklama:** Sistem, logları belli bir süre saklamakta ve gerektiğinde arşivlemektedir.`,
        },
    ],
    chartData: {
        // Grafikler için demo veri seti (PDF'te yer almayan, sunum amaçlı veriler)
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'İşlem Hacmi (Bin TL)',
                data: [400, 450, 600, 750, 650, 900, 1100, 1050, 1300, 1500, 1700, 1950],
                borderColor: '#FF007F', // Pembe Neon
                backgroundColor: 'rgba(255, 0, 127, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Sistem Uyarısı (Adet)',
                data: [15, 12, 10, 8, 5, 4, 6, 3, 2, 1, 0, 0],
                borderColor: '#FFC107', // Sarı Neon
                backgroundColor: 'rgba(255, 193, 7, 0.2)',
                tension: 0.2,
                pointRadius: 4,
                yAxisID: 'y1',
            }
        ],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'İşlem Hacmi',
                        color: '#FF007F',
                    },
                    grid: {
                        color: 'rgba(55, 65, 81, 0.5)',
                    },
                    ticks: {
                        color: '#FF007F',
                    },
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Hata/Uyarı Sayısı',
                        color: '#FFC107',
                    },
                    grid: {
                        drawOnChartArea: false,
                        color: 'rgba(55, 65, 81, 0.5)',
                    },
                    ticks: {
                        color: '#FFC107',
                    },
                },
                x: {
                    grid: {
                        color: 'rgba(55, 65, 81, 0.5)',
                    },
                    ticks: {
                        color: '#E5E7EB',
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#F9FAFB',
                    }
                }
            }
        }
    }
};

export default MESTEG_CONTENT;
