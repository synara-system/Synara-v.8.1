// path: lib/trpc/Provider.jsx

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { getBaseUrl } from "@/lib/trpc/utils"; 
import { useAuth } from "@/context/AuthContext"; 
// KRİTİK EKLENTİ 1: Oturum dışı bırakma için useRouter'ı import et
import { useRouter } from "next/navigation";

/**
 * tRPC istemcisini oluşturan ve React Query'yi sağlayan temel sağlayıcı bileşeni.
 * Firebase kimlik doğrulama tokenını (JWT) her istekte 'Authorization' başlığı olarak ekler.
 */
export default function TrpcProvider({ children }) {
  const { user, loading: authLoading, handleLogout } = useAuth(); 
  const router = useRouter();
  
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60000, 
        cacheTime: 1000 * 60 * 5, 
        refetchOnWindowFocus: false, 
        refetchOnReconnect: false, // KRİTİK FİX: Mobil için gereksiz refetch'i engeller.
      }
    }
  }));

  const trpcClient = useMemo(() => {
    return trpc.createClient({
        links: [
            httpBatchLink({
                url: `${getBaseUrl()}/api/trpc`,
                
                async headers() {
                    if (!user) {
                        return {}; 
                    }
                    
                    try {
                        // Token'ın süresi dolmuşsa yenilemeyi dener.
                        const token = await user.getIdToken(true); 
                        
                        return {
                            authorization: `Bearer ${token}`, 
                        };
                    } catch (error) {
                        console.warn("[tRPC Provider KRİTİK HATA] Firebase ID Token çekilemedi:", error);
                        // Eğer token çekilemezse (genellikle oturum kapanmıştır), boş gönder.
                        return {};
                    }
                },
            }),
        ],
        // KRİTİK EKLENTİ 2: Hata yönetimi (Token süresi dolduğunda veya yetkisiz erişimde otomatik çıkış)
        transformer: undefined,
        queryClient,
        onError: ({ error, query, type }) => {
            // Sunucudan gelen UNAUTHORIZED (401) hatasını kontrol et
            if (error.data?.code === 'UNAUTHORIZED') {
                // KRİTİK PROTOKOL: Hata mesajı oturumun sona erdiğini gösteriyorsa (context.js'den gelen)
                console.error("[SYNARA PROTOCOL] UNAUTHORIZED Hata Algılandı. Otomatik Çıkış Başlatılıyor...");
                
                // Tokenı veya Firebase session'ı temizle
                handleLogout(); 
                
                // Kullanıcıyı Login sayfasına yönlendir.
                router.push('/login');
                
                // TanStack Query'nin bu hatayı tekrar denemesini engelle (opsiyonel)
                if (query.meta.attemptCount === 0) { 
                    queryClient.invalidateQueries(); // Tüm sorguları geçersiz kıl
                    queryClient.clear();
                }
            } else {
                 console.error(`[tRPC KESİCİ HATA] Tip: ${type}, Hata: ${error.message}`);
            }
        },
    });
  }, [user, handleLogout, router, queryClient]); 

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
