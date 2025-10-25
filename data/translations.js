// path: data/translations.js
import { notificationTranslations } from './translation-notifications.js';

/**
 * Firebase Auth hatalarını kullanıcı dostu mesajlara çevirir.
 * @param {import('firebase/auth').AuthError} err 
 * @param {object} T - Translation object
 * @returns {{ message: string }}
 */
export const handleFirebaseError = (err, T) => {
    let message = T?.error_auth_generic || 'Giriş işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edin.';
    // Firebase kodlarına göre özel mesajlar
    if (err.code === 'auth/user-not-found') message = T?.error_auth_user_not_found || 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.';
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') message = T?.error_auth_wrong_password || 'E-posta veya şifre yanlış.';
    if (err.code === 'auth/too-many-requests') message = T?.login_attempts_exceeded || 'Çok fazla hatalı deneme. Erişim geçici olarak kilitlendi.';
    if (err.code === 'auth/email-already-in-use') message = T?.error_auth_email_in-use || 'Bu e-posta adresi zaten kullanılıyor.';
    
    return { message };
};

export const translations = {
    tr: {
        // --- BİLDİRİM METİNLERİ ---
        // KRİTİK FİX: handleFirebaseError artık burada spread edilmiyor, sadece mesajlar kalıyor.
        ...notificationTranslations.tr, 

        // --- GENEL SEO ALANLARI (YENİ EKLENTİ) ---
        seo_default_title: "Synara System | Anchor TF ile Repaint Yapmayan Kripto Sinyalleri",
        seo_default_description: "Synara, Anchor bar kapanışında teyitli, repaint yapmayan sinyaller üretir; duygusal hataları sistematik disiplinle eleyerek tek karara indirger. Hemen deneyin.",
        seo_default_keywords: "Synara, TradingView, Kripto Analiz, Yapay Zeka, Alım Satım Sinyalleri, Bütünsel Zeka, Repaint Yapmayan İndikatör, Anchor TF",


        // --- SİTE GENELİ & NAVİGASYON ---
        title: "Synara System | Veri Odaklı Kararlarla Finansal Piyasalar",
        nav_home: "Ana Sayfa",
        nav_features: "Sistem Felsefesi",
        nav_modules: "Sistem Mimarisi", // Bu, modül sayfasının ana başlığı
        nav_modules_header: "Sistem Mimarisi", // KRİTİK EKLENTİ: Header sekmesi için
        nav_pricing: "Abonelik",
        nav_contact: "İletişim",
        nav_blog: "İçerikler", // Blog/Haberler sekmesi
        nav_news: "Piyasa Haberleri",
        nav_analysis_portal: "Analiz Portalı",
        nav_login: "Giriş Yap",
        nav_register: "Kayıt Ol",
        nav_dashboard: "Panelim",
        nav_admin: "Yönetim",
        nav_logout: "Çıkış Yap",
        nav_back_to_home: "Ana Sayfaya Dön",
        nav_back_to_blog: "Tüm Yazılara Dön",
        nav_kasa_yonetimi: "Kasa Yönetimi",
        nav_live_chart: "Piyasa Nabzı",
        nav_kokpit: "Performans Kokpiti",
        nav_lig: "Disiplin Ligi",
        nav_about_us: "Mesteg Teknoloji",
        nav_vision: "Vizyon",
        nav_assistant: "Yapay Zeka Asistanı",

        // --- GENEL TERİMLER ---
        loading: "Yükleniyor...",
        coming_soon: "Çok Yakında",
        read_more: "Devamını Oku",
        reading_time_minutes: "dk okuma süresi",
        user_name: "Siz",

        // --- HABERLER SAYFASI (news) ---
        news_page_title: "Trader Haber Merkezi",
        news_page_subtitle: "Piyasayı yönlendiren kritik haber akışları, makroekonomik veriler ve uzman analizleri.",
        news_category_all: "Tümü",
        news_category_crypto: "Kripto Paralar",
        news_category_macro: "Makroekonomi",
        news_category_gold: "Değerli Metaller",
        news_category_forex: "Döviz Piyasaları",
        news_category_stock: "Borsa & Hisseler",
        news_category_system: "Sistem Güncellemeleri",
        
        // --- BLOG SAYFASI BAŞLIĞI (YENİ EKLENTİ) ---
        blog_page_title_header: "Blog & Yönetim", // KRİTİK DÜZELTME: Blog sayfası büyük başlığı için "Blog & Synara System"
        blog_page_subtitle: "Kripto piyasaları, makroekonomi ve kurumsal sistem güncellemeleri üzerine en son analizler, teyitli eğitimler ve Synara'nın bütünsel zeka felsefesi.",


        // --- HAKKIMIZDA SAYFASI (about-us) ---
        about_us_page_title: "Hakkımızda | Synara System Felsefesi",
        about_us_hero_subtitle: "Synara System'in arkasındaki mühendislik disiplinini ve piyasa vizyonunu keşfedin.",
        about_us_founder_title: "Kurucu Felsefesi: Mühendislikten Piyasaya",
        about_us_founder_message: "Disiplin, duyguya üstün gelir. Piyasa kaosunu, kuralları olan bir sisteme dönüştürüyoruz.",
        about_us_vision_protocol: "Bu felsefe, Synara'nın temelidir: **\"Bar Kapanışında Mühürlenmiş, Teyitli Karar\"**",
        about_us_section1_title: "Bütünsel Zeka Matrisi (HIM)",
        about_us_section1_desc: "Yüzlerce veri noktasını (teknik, temel, on-chain) tek bir 'Karar Skoru'na indirgeyen, objektif bir analiz motoru.",
        about_us_section2_title: "Repaint Korumalı Teknoloji",
        about_us_section2_desc: "Tüm kararlar, bar kapanışında mühürlenir. Geriye dönük sinyal değişimi veya 'repaint' teknolojik olarak imkansızdır.",
        about_us_section3_title: "Risk Yönetimi Çekirdeği",
        about_us_section3_desc: "Entegre Kasa Yönetimi ve Akıllı Risk Kapıları (Risk Gates), sermayenizi piyasa çalkantılarından korumak için tasarlanmıştır.",
        about_us_sa: "Stratejik Analiz ve Kurumsal Çözümler",
        about_us_sa_desc: "Mesteg Teknoloji, finansal kurumlar ve özel fonlar için Synara altyapısını kullanarak özelleştirilmiş stratejik analiz ve portföy yönetimi çözümleri sunmaktadır.",
        
        // --- ANA SAYFA (homepage) ---
        hero_tag: "BÜTÜNSEL ZEKA MATRİSİ (HIM)",
        hero_title_part1: "Piyasa Karmaşasını",
        hero_title_part2: "Tek Bir Karara İndirgeyin.",
        hero_subtitle_new: "Synara’nın tescilli Bütünsel Zeka Matrisi, yüzlerce dinamik veriyi sentezleyerek, bar kapanışında mühürlenen, asla değişmeyen (repaint-free) kararlar üretir.",
        hero_cta_main: "Sistemi Ücretsiz Deneyin",
        hero_cta_secondary: "Mimarimizi Keşfedin",
        hero_social_proof: "400'den fazla disiplinli trader topluluğuna katılın.",
        
        // --- MODÜLLER BÖLÜMÜ ---
        modules_section_title: "5 Uzman Modül, 1 Merkezi Karar Motoru",
        modules_section_subtitle: "Piyasanın farklı katmanlarını deşifre eden uzman modüllerimiz, analizlerini tek bir nihai karar için Synara Engine'de birleştirir.",

        // --- FİYATLANDIRMA BÖLÜMÜ (pricing) ---
        pricing_section_title: "Abonelik Paketleri",
        pricing_section_subtitle: "Tüm Synara modüllerine ve karar motoruna tek bir paketle tam erişim sağlayın.",
        pricing_plan_title: "Tüm Modüller Tek Pakette",
        pricing_badge: "BÜTÜNSEL ERİŞİM",
        pricing_price: "$59",
        pricing_period_monthly: "/aylık",
        pricing_includes_title: "Pakete Dahil Olanlar:",
        pricing_feature1: "Engine: Nihai Karar Motoru",
        pricing_feature2: "Nexus: Akıllı Likidite Analizi",
        pricing_feature3: "Metis: Makro Rejim Filtresi",
        pricing_feature4: "RSI-HAN: Gelişmiş Momentum Taraması",
        pricing_feature5: "Visuals: Konsensüs Skoru",
        pricing_feature6: "Repaint Korumalı Sinyal Teknolojisi",
        pricing_feature7: "Özel Topluluk ve Disiplin Ligi",
        pricing_cta_button: "Aboneliği Başlat",
        
        // --- SSS BÖLÜMÜ (faq) ---
        faq_title: "Sıkça Sorulan Sorular",

        // --- İLETİŞİM BÖLÜMÜ (contact) ---
        contact_section_title: "İletişim Protokolü",
        contact_section_subtitle: "Kurumsal işbirlikleri, proje talepleri veya teknik destek için bize ulaşın.",
        contact_form_title: "Güvenli Mesaj Formu",
        form_name_placeholder: "Adınız Soyadınız",
        form_email_placeholder: "E-posta Adresiniz",
        form_message_placeholder: "Mesajınız...",
        form_submit_button: "Mesajı Gönder",
        whatsapp_tooltip: "Canlı Destek Hattı",
        whatsapp_message: "Merhaba, Synara System hakkında bilgi almak istiyorum.",

        // --- FOOTER ---
        footer_architecture: "Sistem Mimarisi",
        footer_quick_links: "Hızlı Erişim",
        footer_corporate_legal: "Kurumsal ve Yasal",
        footer_contact_vision: "İletişim ve Vizyon",
        footer_contact_info: "Destek ve kurumsal talepleriniz için bize ulaşabilirsiniz.",
        footer_rights: "Tüm hakları saklıdır.",
        // KRİTİK DÜZELTME: Footer SEO anahtar kelimeleri eklendi
        footer_seo_keywords: "Mesteg Teknoloji LTD. ŞTİ., TradingView Sinyalleri, Kripto Analiz, Yapay Zeka Sinyalleri, Anchor TF, Repaint Yapmayan İndikatör, Piyasa Otoritesi, Holistik Zeka Matrisi (HIM)", 
        footer_disclaimer: "YASAL UYARI: Bu platformda sunulan veriler ve analizler, Sermaye Piyasası Kurulu'nun yatırım danışmanlığı tebliği kapsamında değildir. Yatırım kararlarınız, kişisel risk ve getiri tercihlerinize uygun olarak, kendi araştırmalarınız doğrultusunda alınmalıdır.",
        footer_terms: "Hizmet Şartları",
        footer_privacy: "Gizlilik Politikası",

        // --- OTURUM YÖNETİMİ (login, register, reset) ---
        login_title: "Sisteme Giriş Yapın",
        login_subtitle: "Synara'nın bütünsel zeka matrisine ve panelinize erişin.",
        email_label: "E-posta Adresi",
        email_placeholder: "E-posta adresiniz",
        password_label: "Şifre",
        password_placeholder: "Şifreniz",
        login_forgot_password: "Şifremi unuttum",
        login_button: "Giriş Yap",
        separator_text: "veya",
        login_google_button: "Google ile Giriş Yap",
        login_no_account_prompt: "Hesabınız yok mu?",
        login_register_link: "Hemen Kayıt Olun",

        register_title: "Yeni Hesap Oluşturun",
        have_account: "Zaten bir hesabınız var mı?",
        register_with_google: "Google ile Kayıt Olun",
        register_button: "Hesabımı Oluştur",

        reset_password_title: "Şifre Sıfırlama",
        reset_password_subtitle: "Hesabınıza bağlı e-posta adresini girin, size bir sıfırlama linki göndereceğiz.",
        reset_password_button: "Sıfırlama Linki Gönder",
        reset_password_back_to_login: "Giriş Ekranına Dön",
        
        // --- KULLANICI PANELİ (Dashboard) ---
        dashboard_welcome: "Tekrar Hoş Geldiniz",
        dashboard_subtitle: "Synara Komuta Merkeziniz",
        dashboard_sub_status: "Abonelik Durumu",
        dashboard_sub_status_active: "Aktif",
        dashboard_sub_status_inactive: "Pasif",
        dashboard_sub_status_pending: "Onay Bekleniyor",
        dashboard_sub_expires_on: "Geçerlilik Tarihi",
        dashboard_manage_sub: "Aboneliği Yönet",
        dashboard_tv_user: "TradingView Kullanıcı Adı",
        
        // --- MODÜL SAYFALARI ---
        modules_page_header_tag: "SİSTEM ÇEKİRDEK MİMARİSİ",
        modules_page_title_part1: "Disiplinli Karar Alma",
        modules_page_title_part2: "Protokolü",
        modules_page_subtitle: "Synara Engine'i besleyen 5 uzman modülün çalışma prensiplerini ve bütünsel zeka yaklaşımımızı keşfedin.",
        
        detail_button_engine: "Engine: Karar Motoru",
        detail_button_nexus: "Nexus: Piyasa Yapısı/OB",
        detail_button_metis: "Metis: Makro/Likidite",
        detail_button_rsi: "RSI-HAN: Momentum",
        detail_button_visuals: "Visuals: Konsensüs",

        nexus_tab_title: "Nexus: Piyasa Yapısı",
        nexus_page_title: "Akıllı Likidite Avcısı",
        nexus_tab_desc: "Piyasa yapıcıların (market maker) likidite topladığı kritik bölgeleri (Order Block) tespit ederek Engine'i besler.",
        nexus_feat1_title: "Otomatik Order Block Tespiti",
        nexus_feat1_desc: "Fiyatın sert hareket ettiği ve arkasında doldurulmamış emirler bıraktığı kilit bölgeleri otomatik olarak belirler.",
        nexus_feat2_title: "Dinamik Çıkış Protokolü",
        nexus_feat2_desc: "Kâr alma (TP) hedefleri, piyasanın anlık volatilitesine (ATR) veya kırılan yapıya göre dinamik olarak hesaplanır.",
        nexus_feat3_title: "Gürültü Filtreleme (Non-Repaint)",
        nexus_feat3_desc: "Sadece iğne ucuyla gerçekleşen sahte kırılımları filtreler, teyitli yapı değişimleriyle Engine'i tetikler.",

        metis_tab_title: "Metis: Makro Rejim",
        metis_page_title: "Trendin DNA Analizi",
        metis_tab_desc: "Çoklu zaman dilimlerinde trendin sağlığını ve gücünü ölçerek piyasanın genel rejimini (yönünü) belirler.",
        metis_feat1_title: "Üst Zaman Dilimi Likiditesi (ULE 2.0)",
        metis_feat1_desc: "Günlük, haftalık ve aylık gibi kilit likidite seviyelerini izler ve bu seviyeler alındığında Engine'e bilgi verir.",
        metis_feat2_title: "Seanslar Arası Likidite Avı",
        metis_feat2_desc: "Asya, Londra ve New York seanslarının zirve/dip noktalarını takip ederek seanslar arası güç dengesini analiz eder.",
        metis_feat3_title: "Piyasa Rejimi Filtresi",
        metis_feat3_desc: "Piyasanın 'Trend' mi yoksa 'Aralık (Range)' mı olduğunu belirleyerek Engine'e en uygun stratejiyi bildirir.",

        rsi_tab_title: "RSI-HAN: Momentum",
        rsi_page_title: "Uyumsuzluk Avcısı",
        rsi_tab_desc: "Fiyat ve momentum arasındaki gizli uyumsuzlukları tespit ederek potansiyel trend dönüşlerini önceden sinyaller.",
        rsi_feat1_title: "Dinamik Cobra Kanalı",
        rsi_feat1_desc: "Standart RSI seviyeleri yerine, piyasa volatilitesine göre kendini ayarlayan dinamik 'aşırı alım/satım' kanalları kullanır.",
        rsi_feat2_title: "Gizli Uyumsuzluk Tespiti",
        rsi_feat2_desc: "Klasik uyumsuzlukların ötesinde, trendin devam edeceğini gösteren 'gizli' (hidden) uyumsuzlukları da yakalar.",
        rsi_feat3_title: "Hacim Teyitli Sinyaller",
        rsi_feat3_desc: "Momentum sinyallerinin gücünü hacim verileriyle teyit eder, zayıf ve manipülatif sinyalleri ayıklar.",

        visuals_tab_title: "Visuals: Konsensüs",
        visuals_page_title: "Çoklu Zaman Dilimi Onayı",
        visuals_tab_desc: "Tüm modüllerden ve çoklu zaman dilimlerinden gelen verileri birleştirerek bir 'Konsensüs Skoru' oluşturur.",
        visuals_feat1_title: "Trend Atlası",
        visuals_feat1_desc: "Farklı hareketli ortalamalar ve kanal yapılarını tek bir ekranda yorumlayarak piyasanın genel yönünü görselleştirir.",
        visuals_feat2_title: "SV-Bridge Matrisi",
        visuals_feat2_desc: "Farklı zaman dilimlerinin (5dk, 1s, 4s, 1g) kritik metriklerini tek bir matriste toplayarak anlık bir piyasa özeti sunar.",
        visuals_feat3_title: "Nihai Konsensüs Skoru",
        visuals_feat3_desc: "Tüm verilerin ne kadar uyumlu olduğunu ölçer ve Engine'e nihai karar için bir güven skoru gönderir.",
        
        engine_tab_title: "Engine: Karar Merkezi",
        engine_page_title: "Nihai Karar Motoru",
        engine_tab_desc: "Tüm modüllerden gelen verileri birleştirerek nihai, repaint korumalı ve teyitli kararları üretir.",
        engine_feat1_title: "Bütünsel Zeka Matrisi (HIM)",
        engine_feat1_desc: "Tüm modüllerden gelen verileri, anlık piyasa koşullarına göre akıllıca ağırlıklandırarak tek bir 'Karar Skoru' hesaplar.",
        engine_feat2_title: "Akıllı Risk Kapıları (Risk Gates)",
        engine_feat2_desc: "Piyasa aşırı volatil veya öngörülemez olduğunda sinyal üretimini otomatik olarak durdurarak sermayenizi korur.",
        engine_feat3_title: "Bar Kapanışı Mühürleme Protokolü",
        engine_feat3_desc: "Tüm kararlar, bar kapanışında mühürlenir. Bu sayede sinyal asla geriye dönük olarak değişmez (Repaint-Free).",

        // --- KASA YÖNETİMİ ---
        kasa_page_title: "Kasa Yönetimi Protokolü",
        kasa_title: "Disiplinli Kasa Yönetimi",
        kasa_subtitle: "Sermayenizi profesyonel bir yaklaşımla koruyun ve büyütün.",
        kasa_loading: "Kasa verileri yükleniyor...",
        kasa_set_initial_balance: "Başlangıç Bakiyesini Tanımlayın",
        kasa_initial_balance_placeholder: "Başlangıç Bakiyeniz ($)",
        kasa_start_button: "Protokolü Başlat",
        kasa_current_balance: "Güncel Bakiye",
        kasa_add_trade: "Yeni İşlem Ekle",
        kasa_update_trade: "İşlemi Güncelle",
        kasa_instrument_placeholder: "Parite (örn: BTCUSDT)",
        kasa_quantity_placeholder_usd: "Pozisyon Büyüklüğü ($)",
        kasa_entry_price_placeholder: "Giriş Fiyatı",
        kasa_stop_loss_placeholder: "Zarar Durdur (SL)",
        kasa_exit_price_placeholder: "Kâr Al (TP) / Çıkış Fiyatı",
        kasa_margin_placeholder: "Kaldıraç (örn: 10x)",
        kasa_note_placeholder: "İşlem Notu (opsiyonel)",
        kasa_long: "Alış (Long)",
        kasa_short: "Satış (Short)",
        kasa_add_button_long: "Pozisyonu Aç",
        kasa_update_button: "Güncelle",
        kasa_cancel_edit: "İptal",
        kasa_cash_flow: "Nakit Akışı",
        kasa_deposit: "Para Yatırma",
        kasa_withdraw: "Para Çekme",
        kasa_cash_flow_placeholder: "Miktar ($)",
        kasa_confirm_cash_flow: "Nakit Akışını Onayla",
        kasa_open_positions: "Açık Pozisyonlar",
        kasa_no_open_positions: "Aktif pozisyon bulunmuyor.",
        kasa_trade_history: "İşlem Geçmişi",
        kasa_no_trades: "Henüz kapatılmış işlem yok.",
        kasa_cash_flow_history: "Nakit Akışı Geçmişi",
        kasa_balance_chart: "Bakiye Büyüme Eğrisi",
        kasa_confirm_delete: "Bu işlemi kalıcı olarak silmek istediğinizden emin misiniz?",
        kasa_summary_total_pnl: "Toplam Kâr/Zarar",
        kasa_summary_daily_pnl: "Günlük Kâr/Zarar",
        kasa_summary_weekly_pnl: "Haftalık Kâr/Zarar",
        kasa_summary_monthly_pnl: "Aylık Kâr/Zarar",
        kasa_summary_win_rate: "Kazanma Oranı",
        kasa_summary_avg_rr: "Ortalama Risk/Ödül",
        kasa_summary_total_trades: "Toplam İşlem Sayısı",
        kasa_baslangic: "Başlangıç",
        kasa_table_instrument: "Enstrüman",
        
        // --- PERFORMANS KOKPİTİ ---
        kokpit_title: "Performans Kokpiti",
        kokpit_subtitle: "Kasa yönetimi verilerinize dayalı detaylı performans metrikleri.",
        kokpit_no_data_title: "Analiz İçin Yetersiz Veri",
        kokpit_no_data_desc: "Performans kokpitini görüntülemek için en az bir adet kapatılmış işleminiz olmalıdır.",
        kokpit_error_fetch: "Kokpit verileri çekilirken bir hata oluştu.",
        
        // --- PİYASA NABZI ---
        market_pulse_page_title: "Piyasa Nabzı",
        market_pulse_sessions_title: "Piyasa Seansları ve Likidite Saatleri",
        market_pulse_closes_in: "Kapanışa:",
        market_pulse_opens_in: "Açılışa:",
        market_pulse_closed: "Kapalı",
        market_pulse_tokyo: "Asya Seansı",
        market_pulse_london: "Londra Seansı",
        market_pulse_new_york: "New York Seansı",
        market_pulse_economic_calendar_title: "Yüksek Etkili Ekonomik Veriler",
        market_pulse_impact_high: "Yüksek Etki",
        market_pulse_impact_medium: "Orta Etki",
        market_pulse_volatility_title: "Anlık Volatilite Endeksi",
        market_pulse_volatility_high: "Yüksek Volatilite",
        market_pulse_volatility_medium: "Orta Volatilite",
        market_pulse_volatility_low: "Düşük Volatilite",
        market_pulse_fear_greed_title: "Korku & Açgözlülük Endeksi",
        market_pulse_fear_greed_status_extreme_fear: "Aşırı Korku",
        market_pulse_fear_greed_status_fear: "Korku",
        market_pulse_fear_greed_status_neutral: "Nötr",
        market_pulse_fear_greed_status_greed: "Açgözlülük",
        market_pulse_fear_greed_status_extreme_greed: "Aşırı Açgözlülük",
        market_pulse_top_gainers: "En Çok Yükselenler (Trend)",
        market_pulse_top_losers: "En Çok Düşenler (24s)",
        market_pulse_funding_rates: "Fonlama Oranları (Funding Rates)",
        market_pulse_long_short_ratio: "Long/Short Oranları",

        // --- VİZYON SAYFASI ---
        vision_page_title: "Bir Mimarın Yolculuğu: Vizyon Protokolü",
        vision_hero_subtitle: "Donanım mühendisliği disiplininden, piyasa kaosunu sisteme dönüştüren bir vizyon.",
        vision_founder_note_title: "Kurucu Notu: Neden Synara?",
        vision_founder_note_content: "\"Piyasa bir kaos değildir; kuralları olan, ancak çoğu zaman duygusal gürültüyle perdelenen bir sistemdir. Yıllarca kritik altyapı projelerinde, hatanın felaket anlamına geldiği sistemler tasarladım. Bu mühendislik disiplinini finans piyasalarına uyguladığımda Synara doğdu: Duyguyu denklemden çıkaran, sadece teyitli verilerle çalışan, bar kapanışında kararını mühürleyen bir yapı. Synara, bir tahmin aracı değil, bir disiplin protokolüdür.\"",
        vision_section1_title: "1996: Donanım ve Gömülü Sistemler Mimarisi",
        vision_section1_content: "Her bir bit'in ve saat döngüsünün kritik olduğu, hataya toleransın sıfır olduğu donanım ve yazılım mimarileri tasarlandı.",
        vision_section2_title: "2014: Kritik Altyapı ve Endüstriyel Otomasyon",
        vision_section2_content: "Enerji ve otomasyon sektörlerinde, 7/24 kesintisiz çalışması gereken, yedekli ve hataya dayanıklı büyük ölçekli sistemler yönetildi.",
        vision_section3_title: "2020: Piyasa Kaosu ve 'Repaint' İllüzyonu",
        vision_section3_date: "PANDEMİ DÖNEMİ",
        vision_section3_content: "Finansal piyasalardaki 'repaint' yapan (geriye dönük değişen) indikatörlerin ve duygusal kararların neden olduğu sermaye kayıpları, yeni ve güvenilir bir sistem ihtiyacını doğurdu.",
        vision_section4_title: "2022: Synara Protokolü'nün Doğuşu",
        vision_section4_date: "BUGÜN",
        vision_section4_content: "Mühendislik disiplini, piyasa tecrübesiyle birleşti. Bütünsel Zeka Matrisi (HIM) ve Bar Kapanışı Mühürleme Protokolü ile Synara hayata geçti.",

        // --- HATA SAYFALARI ---
        not_found_title: "Protokol Hatası: Sayfa Bulunamadı",
        not_found_message: "Aradığınız kaynak mevcut değil veya erişim yetkiniz dışında olabilir.",
        
        // --- ANALİZ PORTALI ---
        analysis_portal_title: "Analiz Portalı",
        analysis_portal_subtitle: "Topluluk tarafından oluşturulan, oylanan ve yapay zeka tarafından değerlendirilen piyasa analizleri.",
        analysis_create_new: "Yeni Analiz Oluştur",
        analysis_form_title: "Başlık",
        analysis_form_title_placeholder: "Analizinizin başlığını girin (örn: BTC Yükseliş Yapısı Analizi)",
        analysis_form_instrument: "Enstrüman",
        analysis_form_instrument_placeholder: "örn: BTCUSDT, EURUSD",
        analysis_form_tv_url: "TradingView Grafik URL'si",
        analysis_form_tv_url_placeholder: "https://www.tradingview.com/x/...",
        analysis_form_content: "Analiz İçeriği (Markdown formatı desteklenir)",
        analysis_form_submit: "Analizi Yayınla",
        analysis_form_publishing: "Yayınlanıyor...",
        analysis_rating_title: "Analizi Puanla",
        analysis_rating_count: "oy",
        analysis_comments_title: "Yorumlar",
        analysis_login_to_rate: "Puanlamak için giriş yapmalısınız.",
        analysis_login_to_comment: "Yorum yapmak için giriş yapmalısınız.",
        analysis_ai_take: "Synara AI Değerlendirmesi",
        analysis_generate_ai_commentary: "AI Değerlendirmesi Oluştur",
        analysis_highest_score: "En Yüksek Puanlı",
        analysis_synara_score: "Synara Puanı",
        analysis_no_analyses: "Henüz yayınlanmış bir analiz yok.",
        analysis_generate_ai_confirm: "Bu analiz için bir yapay zeka değerlendirmesi oluşturmak istiyor musunuz?",
        analysis_generating_ai: "Oluşturuluyor...",

        // --- LİG SAYFASI ---
        lig_subtitle: "Synara trader'ları arasındaki disiplin metriklerine dayalı anonim liderlik tablosu.",
        lig_no_data: "Veri Yetersiz",
        lig_disclaimer: "Liderlik tablosu, tüm kullanıcıların verileri anonimleştirilerek oluşturulur ve saatte bir güncellenir.",
        lig_error_fetch: "Liderlik verileri çekilirken bir hata oluştu.",

        // --- BLOG YAZISI ---
        comments_title: "Topluluk Yorumları",
        comment_placeholder: "Yorumunuzu buraya yazın...",
        comment_login_prompt: "Yorum yapmak ve Synara topluluğuna katılmak için lütfen giriş yapın.",
        comment_sending: "Gönderiliyor...",
        comment_send_button: "Yorumu Gönder",

        // --- ÇEREZ BANNERI ---
        cookie_banner_text: "Platformumuzda size daha iyi bir deneyim sunmak için çerezler kullanıyoruz.",
        cookie_banner_accept: "Kabul Et",
        cookie_banner_reject: "Reddet",
    }
};
