// path: data/translation-notifications.js

export const notificationTranslations = {
    tr: {
        // --- BİLDİRİM/MODAL BAŞLIKLARI ---
        notification_success_title: "Sistem Onayladı",
        notification_error_title: "Kritik Hata",
        notification_info_title: "Bilgi Protokolü",
        notification_confirm_title: "Onay Gerekli",

        // --- GENEL HATALAR ---
        error_boundary_title: "Sistem Hatası",
        error_boundary_message: "Uygulama beklenmeyen bir hata ile karşılaştı. Lütfen tekrar deneyin.",
        generic_firebase_error: "Veritabanı işlemi sırasında bir hata oluştu.",

        // --- KAYIT (REGISTER) SAYFASI BİLDİRİMLERİ ---
        register_terms_required: 'Kayıt olmak için Kullanım Şartları ve Gizlilik Politikası onaylarını vermelisiniz.',
        register_fields_required: 'Lütfen zorunlu alanları (Ad, TV Kullanıcı Adı, E-posta, Şifre) doldurun.',
        register_success_email: 'Hesabınız başarıyla oluşturuldu! Doğrulama linki e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin ve sistemi aktifleştirin.',
        register_google_terms_required: 'Google ile kayıt olmak için de Kullanım Şartları ve Gizlilik Politikası onaylarını vermelisiniz.',
        register_success_google: 'Google hesabınızla başarıyla kayıt oldunuz! Lütfen Dashboard\'da TradingView adınızı güncelleyin.',
        register_google_existing_user: 'Bu Google hesabı zaten kayıtlı. Giriş yapılıyor...',
        
        // --- GİRİŞ (LOGIN) SAYFASI BİLDİRİMLERİ ---
        login_success: 'Giriş başarılı. Panele yönlendiriliyorsunuz...',
        login_attempts_exceeded: "Çok fazla hatalı deneme. Erişim 1 dakika süreyle kilitlendi.",
        reset_password_success: "Şifre sıfırlama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.",
        
        // --- KASA YÖNETİMİ ---
        kasa_error_fetch: "Veri çekimi başarısız oldu.",
        kasa_error_invalid_balance: "Başlangıç bakiyesi geçerli ve pozitif bir sayı olmalıdır.",
        kasa_success_initial_set: "Kasa modülü başarıyla aktifleştirildi.",
        kasa_error_initial_set: "Kasa modülü aktifleştirilemedi.",
        kasa_error_invalid_trade_input: "Tüm işlem alanları doğru ve pozitif olmalıdır.",
        kasa_success_trade_added: "İşlem başarıyla kaydedildi.",
        kasa_error_trade_added: "İşlem kaydı başarısız.",
        kasa_error_invalid_cashflow: "Nakit akışı miktarı pozitif olmalıdır.",
        kasa_success_cashflow_added: "Nakit akışı başarıyla kaydedildi.",
        kasa_error_cashflow_added: "Nakit akışı kaydı başarısız.",
        kasa_error_pnl_calc: "PnL/ROE hesaplanamadı. Girdileri kontrol edin.",
        kasa_error_sl_required: "Stop Loss (SL) zorunludur.",
        kasa_error_reset: "Kasa sıfırlama işlemi başarısız.",
        kasa_success_trade_deleted: "İşlem kaydı silindi.", 
        kasa_error_trade_deleted: "İşlem silinemedi.",
        kasa_success_trade_updated: "İşlem başarıyla güncellendi.",

        // --- BLOG & İÇERİK YÖNETİMİ ---
        blog_error_required_fields: "Başlık ve görsel (YouTube veya Banner) zorunludur.",
        blog_success_create: "Yazı başarıyla yayınlandı.",
        blog_success_update: "Yazı başarıyla güncellendi.",
        blog_error_create: "Yazı oluşturulurken hata:",
        blog_error_update: "Yazı güncellenirken hata:",
        comment_login_required: "Yorum yapmak için giriş yapmalısınız.",
        comment_too_short: "Yorum en az 3 karakter olmalıdır.",
        comment_submit_error: "Yorum gönderilemedi.",
        
        // --- ADMİN PANELİ ---
        admin_user_approval_success: "Kullanıcı onay durumu güncellendi.",
        admin_user_deletion_success: "Kullanıcı başarıyla silindi.",
        admin_user_deletion_self_error: "Kendi hesabınızı bu panelden silemezsiniz.",
        admin_user_not_found_error: "Kullanıcı bulunamadı.",

        // --- DASHBOARD ---
        dashboard_update_success: "Bilgileriniz başarıyla güncellendi.",
        dashboard_update_error: "Bilgiler güncellenirken bir hata oluştu.",
        dashboard_fetch_error: "Kullanıcı verileri alınamadı.",
        dashboard_tv_link_success: "TradingView kimliği başarıyla kaydedildi.",
        dashboard_tv_link_error: "TradingView kimliği kaydedilemedi.",
    },
    en: {
        // English versions can be added here
        notification_success_title: "System Confirmed",
        notification_error_title: "Critical Error: Analysis Halted",
        login_title: "Log in to Synara System",
    }
};
