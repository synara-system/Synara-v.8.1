// path: components/ErrorBoundary.js
'use client';

import React, { Component } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { logger } from '@/lib/Logger'; // Logger import edildi

// Tarayıcı uzantılarından gelen ve Synara kodunu etkilemeyen yaygın hata mesajı.
const IGNORED_EXTENSION_ERROR = "A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received";

/**
 * React Hata Sınırı (Error Boundary) Bileşeni.
 * Component alt ağacındaki JavaScript hatalarını yakalar, kaydeder ve fallback UI gösterir.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    // hasError: Hata oluşup oluşmadığını tutar.
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // Hatanın yakalandığını belirten metod (Fallback UI için kullanılır)
  static getDerivedStateFromError(error) {
    // Tarayıcı Uzantısı hatasını yok say (Synara kodunu etkilemez)
    if (error?.message?.includes(IGNORED_EXTENSION_ERROR)) {
        logger.warn("İhmal Edilen Hata: Uzantı Asenkron Yanıt Hatası yakalandı. Konsolda kalır, sunucuya gönderilmez.");
        return { hasError: false }; // hasError'ı false tutarak Fallback UI'ı gösterme
    }
    
    // Bir sonraki render'da fallback UI'ın gösterilmesi için state'i güncelle
    return { hasError: true, error }; // KRİTİK: error'u state'e ekle
  }

  // Hata bilgisini loglamak için metod (Geliştirici veya raporlama servisi için)
  componentDidCatch(error, errorInfo) {
    // getDerivedStateFromError'da ihmal edilen hataları loglama servisine gönderme
    if (error?.message?.includes(IGNORED_EXTENSION_ERROR)) {
      return; 
    }

    console.error("ErrorBoundary yakaladı:", error, errorInfo);
    
    // KRİTİK GÜNCELLEME: Logger'ı kullanarak logla
    logger.fatal(error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // Hata olduğunda gösterilecek yedek UI (Fallback UI)
      const { T } = this.props;
      const errorMessage = T?.error_boundary_message || "Uygulama beklenmeyen bir hata ile karşılaştı. Lütfen tekrar deneyin.";
      const errorTitle = T?.error_boundary_title || "Hata Oluştu!";
      const backHomeText = T?.nav_back_to_home || "Ana Sayfaya Dön";
      
      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
            <div className="text-center p-8 bg-gray-800 rounded-2xl border border-red-500 shadow-2xl max-w-xl w-full">
                <Icon name="alert-triangle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-4xl font-extrabold text-red-500 mb-4">{errorTitle}</h1>
                <p className="text-gray-400 mb-6">{errorMessage}</p>
                <Link 
                    href="/" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center min-w-[200px]"
                    // Ana sayfaya dönerken state'i sıfırla, böylece uygulama tekrar dener.
                    onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })} 
                >
                    {backHomeText}
                </Link>
                {/* Hata detaylarını sadece geliştirme modunda göstermek güvenlik için daha iyidir. */}
                {process.env.NODE_ENV === 'development' && (
                    <details className="mt-8 text-left p-4 bg-gray-700/50 rounded-lg text-sm text-gray-400">
                        <summary className="cursor-pointer font-semibold text-red-300">Detaylar</summary>
                        <p className="mt-2 text-xs break-all whitespace-pre-wrap">
                            <span className="font-bold text-white block mb-1">Hata:</span>
                            {this.state.error && this.state.error.toString()}
                        </p>
                        <p className="mt-2 text-xs break-all whitespace-pre-wrap">
                            <span className="font-bold text-white block mb-1">Component Stack:</span>
                            {this.state.errorInfo?.componentStack}
                        </p>
                    </details>
                )}
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;