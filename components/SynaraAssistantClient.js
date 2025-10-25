// path: components/SynaraAssistantClient.js
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import { useNotification } from '@/context/NotificationContext';
import Icon from '@/components/Icon';
import { db } from '@/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc/client';
import { usePerformanceAnalytics } from '@/hooks/usePerformanceAnalytics';
import Link from 'next/link';
import { marked } from 'marked';

const ASSISTANT_NAME = 'Synara AI Asistan';
const WELCOME_MESSAGE_TEXT = `Merhaba! Ben ${ASSISTANT_NAME}. Synara System&apos;in Bütünsel Zeka Matrisi (HIM) protokolü ile donatılmış durumdayım.

Sana, sistemin **Anchor TF** felsefesi, 5 uzman modülün (Nexus, Metis, RSI-HAN, Visuals, Engine) çalışma prensipleri ve en önemlisi, **kişisel disiplin metriklerin** hakkında bilgi verebilirim.

*Lütfen sorunu açıkça belirt.* Örneğin:
1.  &quot;Kasa performansım nasıl?&quot;
2.  &quot;Nexus modülü ne işe yarar?&quot;
3.  &quot;Risk Kapıları şu an ne durumda?&quot;

Sisteme hoş geldin. **Disiplin Protokolünü Başlat.**`;

// --- KRİTİK DÜZELTME: AutoGrowTextarea kaldırıldı, basit textarea kullanıldı.
// Bu, mesaj giriş alanının yüksekliğini sabit tutarak pencere zıplamasını önleyecektir.

const PerformanceDisciplineKokpit = ({ T, analytics, isLoading, hasData }) => {
    const stats = useMemo(() => [
        { label: T.kasa_summary_win_rate, value: analytics.winRate, unit: '%', icon: 'check-circle-2', color: 'text-green-400', theme: 'green' },
        { label: T.kasa_summary_avg_rr, value: analytics.averageRR, unit: 'R', icon: 'award', color: 'text-yellow-400', theme: 'yellow' },
        { label: "Profit Factor", value: analytics.profitFactor, unit: '', icon: 'bar-chart-2', color: 'text-sky-400', theme: 'sky' },
        // KRİTİK FİX: PnL değeri useMemo içine taşındı
        { label: T.kasa_summary_total_pnl, value: analytics.totalPnl, unit: '$', icon: 'dollar-sign', color: analytics.totalPnl >= 0 ? 'text-green-400' : 'text-red-400', isCurrency: true, theme: analytics.totalPnl >= 0 ? 'green' : 'red' },
    ], [T, analytics]);
    
    const getAiDisciplineComment = () => {
        if (isLoading || !hasData) return "Analiz için veri bekleniyor. Lütfen Kasa Yönetimi&apos;ne gidin.";
        if (analytics.profitFactor < 1) return `KRİTİK UYARI: Profit Factor (${analytics.profitFactor.toFixed(2)}) 1&apos;in altında. Sistem, kasanın eridiğini tespit etti. Disiplin protokollerinizi acilen kontrol edin.`;
        if (analytics.averageRR < 1.5) return `RİSK/ÖDÜL ZAYIF: Ortalama R:R (${analytics.averageRR.toFixed(2)}) 1.5&apos;in altında. Yüksek kazanma oranınız olsa bile riskiniz yüksek. Nexus modülünü kullanarak giriş kalitenizi artırın.`;
        return `DİSİPLİN İYİ: Tüm temel metrikler (Win Rate: ${analytics.winRate.toFixed(1)}%, R:R: ${analytics.averageRR.toFixed(2)}R) disiplinli bir performansa işaret ediyor. Bu ritmi koruyun!`;
    };

    return (
        <div className="p-6 space-y-6 bg-gray-800/80 rounded-2xl border border-sky-700/50 h-full shadow-2xl backdrop-blur-sm">
            <h2 className="text-xl font-bold text-sky-400 flex items-center">
                <Icon name="bar-chart-2" className="w-5 h-5 mr-3" />
                Kişiselleştirilmiş Disiplin Kokpiti
            </h2>
            
            {isLoading ? (
                <div className="text-center p-8 text-gray-500">Veriler Kasa Yönetimi&apos;nden analiz ediliyor...</div>
            ) : hasData ? (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        {stats.map(stat => (
                             <div 
                                key={stat.label} 
                                className={`group relative p-3 rounded-xl border border-gray-700/50 bg-gray-900/50 flex flex-col overflow-hidden transition-all duration-300 hover:border-${stat.theme}-400/50`}
                                style={{boxShadow: `0 0 10px rgba(79, 70, 229, 0.05), 0 0 20px rgba(14, 165, 233, 0.05)`}}
                            >
                                <div className={`absolute inset-0 z-0 opacity-10`} style={{
                                     // KRİTİK FİX: Dinamik renkler yerine Tailwind sınıf adları (safelist) kullanılarak
                                     // CSS değişkenleri oluşturulmalı. Burada direkt CSS değişkenine referans veriliyor.
                                     background: `radial-gradient(circle at 10% 90%, var(--glow-color-${stat.theme}))`,
                                     opacity: '0.1' 
                                }}></div>

                                <h4 className="text-xs font-semibold text-gray-400 relative z-10">{stat.label}</h4>
                                <p className={`text-2xl font-extrabold mt-1 ${stat.color} relative z-10`}>
                                    {stat.isCurrency && stat.value >= 0 ? '+' : ''}
                                    {stat.isCurrency ? stat.value.toFixed(2) : stat.value.toFixed(1)}
                                    {stat.unit}
                                </p>
                            </div>
                        ))}
                    </div>
                    
                    <div className="p-4 bg-indigo-900/50 rounded-lg border border-indigo-700/50 shadow-lg mt-4">
                         <h4 className="text-sm font-bold text-indigo-300 mb-2 flex items-center">
                             <Icon name="zap" className="w-4 h-4 mr-2" />
                             Synara Disiplin Yorumu
                         </h4>
                         <p className="text-sm text-gray-300 italic">{getAiDisciplineComment()}</p>
                         <Link href="/kokpit" className="block text-xs text-right mt-2 text-sky-400 hover:underline">Detaylı Kokpit Raporu</Link>
                    </div>
                    
                </>
            ) : (
                 <div className="text-center p-8 bg-gray-900/50 rounded-xl border border-dashed border-gray-700">
                    <Icon name="wallet" className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Performans analizi için kapalı işlemleriniz bulunmamaktadır.</p>
                    <Link href="/kasa-yonetimi" className="text-xs text-sky-400 hover:underline mt-2 inline-block">Kasa Yönetimi&apos;ne gidin.</Link>
                 </div>
            )}
        </div>
    );
};

const AssistantMessageContent = ({ text, T }) => {
    const htmlContent = useMemo(() => {
        try {
            return { __html: marked.parse(text) };
        } catch (e) {
            return { __html: `<p class="text-red-400">Mesaj ayrıştırılamadı: ${text}</p>` };
        }
    }, [text]);

    const metrics = useMemo(() => ([
        { label: 'Anchor TF Teyidi', value: 'GEÇTİ', color: 'text-green-400' },
        { label: 'HIM Score', value: '91/100', color: 'text-sky-400' },
        { label: 'Context Bridge', value: 'BAĞLI', color: 'text-indigo-400' },
    ]), []);
    
    return (
        <div className="w-full">
            <div 
                 className="prose prose-sm prose-invert max-w-none text-gray-300 leading-relaxed mb-3 whitespace-pre-wrap break-words" 
                 dangerouslySetInnerHTML={htmlContent}
            ></div>
            
            <div className="mt-3 p-2 bg-gray-900/50 border border-sky-700/50 rounded-lg shadow-inner glass-effect" style={{boxShadow: '0 0 10px rgba(14, 165, 233, 0.2)'}}>
                <h4 className="text-xs font-bold text-sky-400 mb-1 flex items-center">
                    <Icon name="boxes" className="w-3 h-3 mr-1 text-indigo-400" />
                    AI Protokol Kontrolü (Simülasyon)
                </h4>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {metrics.map((m, i) => (
                        <div key={i} className="flex items-center text-[10px] font-mono">
                            <span className="text-gray-500 mr-1">{m.label}:</span>
                            <span className={`font-bold ${m.color}`}>{m.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SynaraAssistantClient = () => {
    const { T, user, loading: authLoading } = useAuth();
    const { showAlert, showConfirm } = useNotification();
    const { loading: authReqLoading } = useRequiredAuth({ requireLogin: true });

    const [inputMessage, setInputMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    // KRİTİK: textareaRef artık AutoGrow için değil, doğrudan input için kullanılacak.
    const inputRef = useRef(null);
    
    const isInitialLoad = useRef(true);
    const isUserScrolled = useRef(false);

    const { data: kasaData, isLoading: kasaLoading } = trpc.kasa.getKasaData.useQuery(undefined, {
        enabled: !!user,
        staleTime: 60000 * 5, 
    });

    // KRİTİK FİX (HATA-04): allTradesAndCashFlows değişkeni useMemo içine taşındı
    const allTradesAndCashFlows = useMemo(() => kasaData?.trades || [], [kasaData?.trades]);
    const initialBalanceValue = kasaData?.summary?.initialBalance || 0;
    
    const closedTradesForAnalytics = useMemo(() => 
        allTradesAndCashFlows.filter(t => t.type === 'trade' && t.status === 'closed' && t.pnlUsd !== undefined && t.pnlUsd !== null)
    , [allTradesAndCashFlows]);
    
    const { analytics, loading: analyticsLoading } = usePerformanceAnalytics(closedTradesForAnalytics, initialBalanceValue);
    
    const hasPerformanceData = analytics.totalTrades > 0;
    
    const clearChatsMutation = trpc.kasa.clearAssistantChats.useMutation({
        onSuccess: (data) => {
            showAlert(`Sistem, ${data.count} adet sohbet kaydını temizledi. Yeni bir protokol başlatın.`, 'success');
        },
        onError: (err) => {
             showAlert(`Temizleme Protokolü Hatası: ${err.message}`, 'error');
        }
    });

    const getCleanChatHistory = (msgs) => {
        return msgs.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            text: msg.text,
        }));
    };

    // Kaydırma davranışını 'instant' olarak ayarla (Zıplamayı önler)
    const scrollToBottom = useCallback((behavior = 'instant') => {
        if (messagesEndRef.current && messagesContainerRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
        }
    }, []);
    
    const checkIsUserAtBottom = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return false;
        
        const scrollOffset = container.scrollHeight - (container.scrollTop + container.clientHeight);
        return scrollOffset < 48; 
    }, []);
    
    const handleScroll = useCallback(() => {
        if (!messagesContainerRef.current) return;
        isUserScrolled.current = !checkIsUserAtBottom();
    }, [checkIsUserAtBottom]);
    
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
            
            if (isInitialLoad.current && messages.length > 0) {
                 // İlk yüklemede ani kaydırma
                 setTimeout(() => scrollToBottom('instant'), 50); 
                 isInitialLoad.current = false; 
            }
        }
        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [handleScroll, messages.length, scrollToBottom]);


    useEffect(() => {
        if (!user || !user.uid) return;

        const chatCollRef = collection(db, `kasa/${user.uid}/chats`);
        const q = query(chatCollRef, orderBy('createdAt', 'desc'), limit(50));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate().getTime(),
                };
            }).reverse(); 
            
            const prevMessageCount = messages.length;
            const newMessageCount = fetchedMessages.length;

            setMessages(fetchedMessages);
            
            if (newMessageCount === 0 && isInitialLoad.current) {
                 addDoc(collection(db, `kasa/${user.uid}/chats`), {
                    sender: 'assistant',
                    text: WELCOME_MESSAGE_TEXT,
                    createdAt: Timestamp.now(),
                }).catch(e => console.error("Welcome message add failed:", e));
            }
            
            if (newMessageCount > prevMessageCount) {
                if (messagesContainerRef.current) {
                    const scrollOffset = messagesContainerRef.current.scrollHeight - (messagesContainerRef.current.scrollTop + messagesContainerRef.current.clientHeight);
                    if (scrollOffset < 48) {
                         // Yeni mesaj geldiğinde anlık kaydırma
                         setTimeout(() => scrollToBottom('instant'), 0);
                    }
                }
            }
            
            isInitialLoad.current = false;
        }, (error) => {
            console.error("Firestore sohbet dinleme hatası:", error);
            showAlert("Sohbet geçmişi yüklenirken bir hata oluştu.", 'error');
        });

        return () => unsubscribe();
    // KRİTİK FİX: Bağımlılık dizisine messages.length ve showAlert eklendi.
    }, [user, messages.length, showAlert, scrollToBottom]); 


    const getAiResponseMutation = trpc.ai.getAssistantResponse.useMutation({
        onSuccess: async (data) => {
            const aiText = data?.response?.trim();
            if (!aiText) {
                throw new Error("AI geçerli bir yanıt üretemedi.");
            }
            await addDoc(collection(db, `kasa/${user.uid}/chats`), {
                sender: 'assistant',
                text: aiText,
                createdAt: Timestamp.now(),
            });
        },
        onError: async (error) => {
            console.error("Synara Asistan tRPC Hatası:", error);
            showAlert(`Asistan Hatası: ${error.message}`, 'error');
            await addDoc(collection(db, `kasa/${user.uid}/chats`), {
                sender: 'assistant',
                text: `Kritik Hata Protokolü: AI Servisi yanıt veremedi. Hata kodu: ${error.message.substring(0, 50)}. Lütfen daha sonra tekrar deneyin.`,
                createdAt: Timestamp.now(),
            });
        }
    });

    const fetchAiResponse = useCallback(async (currentHistory) => {
        const chatHistoryPayload = getCleanChatHistory(currentHistory);
        const userMessageText = chatHistoryPayload.slice(-1)[0].text;
        
        const performanceDataForAPI = hasPerformanceData 
            ? { 
                winRate: analytics.winRate, 
                averageRR: analytics.averageRR, 
                totalTrades: analytics.totalTrades, 
                totalPnl: analytics.totalPnl, 
                directionStats: analytics.directionStats 
            } 
            : null;

        getAiResponseMutation.mutate({
            chatHistory: chatHistoryPayload.slice(-9),
            userMessage: userMessageText,
            performanceData: performanceDataForAPI,
        });

    }, [analytics, hasPerformanceData, getAiResponseMutation]);


    const handleSend = async (e) => {
        e.preventDefault();
        const text = inputMessage.trim();
        if (!text || getAiResponseMutation.isLoading || !user) return;
        
        setInputMessage('');
        
        // KRİTİK FİX 1: `newUserMessage`'ı tanımlıyoruz. Bu, `ReferenceError` hatasını çözer.
        const newUserMessage = {
            sender: 'user',
            text: text,
            createdAt: Timestamp.now().toDate().getTime(),
        };

        await addDoc(collection(db, `kasa/${user.uid}/chats`), {
            sender: 'user',
            text: text,
            createdAt: Timestamp.now(),
        });
        
        // Mesaj gönderildikten sonra anlık kaydırma
        setTimeout(() => scrollToBottom('instant'), 0);
        
        // KRİTİK FİX 2: Artık `newUserMessage` tanımlı olduğu için kullanılabilir.
        fetchAiResponse([...messages, newUserMessage]);
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };
    
    const handleClearChats = () => {
         showConfirm(
            "Bu konuşma geçmişini (son 50 mesaj) kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
            () => clearChatsMutation.mutate(),
            {
                title: 'Temizleme Protokolü Onayı',
                confirmButtonType: 'destructive'
            }
        );
    };

    if (authLoading || authReqLoading || !T || !user) {
        return <div className="min-h-screen bg-gray-900 flex justify-center items-center"><p>{T?.kasa_loading || "Asistan Yükleniyor..."}</p></div>;
    }

    const isThinking = getAiResponseMutation.isLoading;


    return (
        <div className="p-4 md:p-8 min-h-screen relative overflow-hidden"> 
             <div className="stars-container-assistant">
                <div id="stars1-assistant"></div>
                <div id="stars2-assistant"></div>
                <div id="stars3-assistant"></div>
             </div>

             <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-full relative z-10">
                
                {/* KRİTİK DÜZELTME 5: Container'a fixed height vermek için h-full yerine min-h-[85vh] ve flex-col yapısı korundu. */}
                <div className="lg:col-span-2 flex flex-col h-full min-h-[85vh] bg-gray-800/90 rounded-3xl shadow-2xl border-2 border-indigo-500/50 backdrop-blur-md">
                    
                    <div className="flex-shrink-0 bg-black/40 p-4 border-b border-sky-700/50 shadow-xl z-20 rounded-t-[1.5rem] flex justify-between items-center">
                        <h1 className="text-xl font-bold text-white flex items-center">
                            <Icon name="boxes" className="w-6 h-6 text-sky-400 mr-3 animate-pulse-slow" />
                            {ASSISTANT_NAME}
                            <span className="ml-2 text-xs text-green-400 font-mono bg-green-900/50 px-2 py-1 rounded-full border border-green-700/50">AKTİF</span>
                        </h1>
                        
                        <button
                             onClick={handleClearChats}
                             disabled={clearChatsMutation.isLoading || messages.length === 0}
                             className="p-2 rounded-full text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-50 border border-transparent hover:border-red-500/50"
                             title="Konuşma Geçmişini Temizle"
                        >
                             <Icon name="trash-2" className="w-5 h-5" />
                        </button>
                    </div>

                    <div 
                        ref={messagesContainerRef} 
                        // KRİTİK DÜZELTME 6: flex-grow ve overflow-y-auto, flex container içinde doğru çalışır.
                        className="flex-grow overflow-y-auto p-6 space-y-6 chat-messages-container" 
                        style={{ scrollbarGutter: 'stable' }} 
                    >
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    layout 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-xs md:max-w-lg p-3 rounded-xl shadow-xl border transition-all duration-300 ${
                                        msg.sender === 'user'
                                            ? 'bg-indigo-700/90 text-white rounded-bl-xl rounded-tr-none border-indigo-500/50' 
                                            : 'bg-gray-700/90 text-gray-200 rounded-br-xl rounded-tl-none border-sky-500/50 shadow-sky-900/10' 
                                    }`}>
                                        <p className={`text-xs font-semibold mb-1 opacity-80 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-sky-300'}`}>
                                            {msg.sender === 'user' ? (T.user_name || 'Siz') : ASSISTANT_NAME}
                                        </p>
                                        
                                        <AssistantMessageContent text={msg.text} T={T} />
                                        
                                        <span className="block text-right text-[10px] text-gray-400 mt-1">
                                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Şimdi'}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            {isThinking && (
                                <motion.div 
                                    layout 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-start"
                                >
                                     <div className="max-w-xs md:max-w-lg p-3 rounded-xl bg-gray-700 rounded-tl-none shadow-md border border-gray-600/50">
                                         <p className="text-xs font-semibold mb-1 text-sky-300 opacity-80">{ASSISTANT_NAME}</p>
                                         <div className="flex items-center space-x-2 text-sky-400">
                                             <div className="w-3 h-3 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                             <div className="w-3 h-3 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                                             <div className="w-3 h-3 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                                             <span className="text-sm font-semibold">Analiz Protokolü İşleniyor...</span>
                                         </div>
                                     </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>

                    {/* KRİTİK ALAN: Mesaj Giriş Kapsayıcısı */}
                    <div className="flex-shrink-0 p-4 bg-black/40 border-t border-gray-700 shadow-inner rounded-b-3xl z-20 pb-safe-area">
                        <form onSubmit={handleSend} className="flex space-x-3">
                            <div className='flex-grow relative'>
                                <textarea
                                    ref={inputRef}
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Synara AI Asistan'a komutunuzu iletin..."
                                    rows="3" 
                                    // CRITICAL STYLES: resize-none, max-h-32, overflow-y-auto ile sabitlendi.
                                    className="w-full p-3 bg-gray-700/80 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-sky-500 disabled:opacity-50 resize-none transition-all duration-200 max-h-32 overflow-y-auto"
                                    disabled={isThinking}
                                />
                                 <span className="absolute bottom-1 right-2 text-[10px] text-gray-500 opacity-80 hidden md:block">
                                 </span>
                            </div>
                            <button
                                type="submit"
                                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 transition-colors shadow-lg shadow-sky-900/50 flex-shrink-0 w-14 h-14"
                                disabled={isThinking || inputMessage.trim() === ''}
                            >
                                <Icon name="send" className="w-5 h-5 mx-auto" />
                            </button>
                        </form>
                    </div>
                </div>
                
                <div className="lg:col-span-1 hidden lg:block h-full">
                     <div className="sticky top-20 h-full">
                         <PerformanceDisciplineKokpit 
                            T={T} 
                            analytics={analytics} 
                            isLoading={kasaLoading || analyticsLoading} 
                            hasData={hasPerformanceData}
                        />
                     </div>
                </div>

             </div>
        </div>
    );
};

export default SynaraAssistantClient;
