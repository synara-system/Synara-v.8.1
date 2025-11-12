// path: components/market/SynaraAssistantWidget.js
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { BrainCircuit, MessageSquare, Send, Loader2, Check, Copy } from 'lucide-react';
import { logger } from '@/lib/Logger';

// === FÜTÜRİSTİK TEMA SABİTLERİ (v1.5) ===
const WIDGET_BASE_CLASSES = "bg-[#111827]/70 backdrop-blur-sm p-6 rounded-xl shadow-2xl transition-all duration-300 border border-indigo-700/50 hover:shadow-cyan-500/50";
const WIDGET_HEADER_CLASSES = "flex items-center space-x-3 border-b border-indigo-700/50 pb-4 mb-4";
// === STİL SONU ===

const SynaraAssistantWidget = ({ marketData }) => {
    // === (v4.0) Mantık Başlangıcı (MemberDashboard'dan Taşındı) ===
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'model', text: 'Ben Synara Asistanı (METIS). Piyasa verilerini veya sistem modüllerini (Nexus, RSI-HAN) sorabilirsiniz.' }
    ]);
    const [hasCopied, setHasCopied] = useState(null);
    const chatContainerRef = useRef(null);
    const aiMutation = trpc.ai.getAssistantResponse.useMutation({
        onSuccess: (data) => {
            setChatHistory(prev => [...prev, { role: 'model', text: data.response }]);
        },
        onError: (error) => {
            logger.error('Gemini Asistan tRPC Hatası (v4.0):', error);
            setChatHistory(prev => [...prev, { role: 'model', text: `Bağlantı Hatası: ${error.message}` }]);
        }
    });

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);
    
    useEffect(() => {
        if (hasCopied !== null) {
            const timer = setTimeout(() => setHasCopied(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [hasCopied]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim() || aiMutation.isLoading) return;

        const newUserMessage = { role: 'user', text: message };
        const currentHistory = [...chatHistory, newUserMessage];
        setChatHistory(currentHistory);
        
        // (v1.7 Hata Düzeltmesi) marketData'nın null olabileceği durumlara karşı savunma eklendi
        const topSector = marketData?.sectorPerformanceData && marketData.sectorPerformanceData.length > 0
            ? marketData.sectorPerformanceData[0]
            : { sector: 'N/A', percentage: 0 };

        const marketContext = {
            fearGreed: marketData?.fearGreedData?.value || 'N/A',
            fearGreedStatus: marketData?.fearGreedData?.value_classification || 'N/A',
            topGainer: marketData?.activesData?.topGainers[0]?.symbol || 'N/A',
            topGainerChange: marketData?.activesData?.topGainers[0]?.changesPercentageNum || 0,
            topLoser: marketData?.activesData?.topLosers[0]?.symbol || 'N/A',
            topLoserChange: marketData?.activesData?.topLosers[0]?.changesPercentageNum || 0,
            topSector: topSector.sector,
            topSectorChange: topSector.percentage,
        };

        aiMutation.mutate({
            chatHistory: chatHistory, 
            userMessage: message, 
            performanceData: marketContext
        });

        setMessage('');
    };
    
    const copyToClipboard = (text, index) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setHasCopied(index);
        } catch (err) {
            logger.error('Metin kopyalanamadı (execCommand):', err);
            navigator.clipboard.writeText(text).then(() => {
                setHasCopied(index);
            }).catch(err => {
                logger.error('Metin kopyalanamadı (navigator):', err);
            });
        }
    };
    // === (v4.0) Mantık Sonu ===


    return (
        // === GÜNCELLEME v1.5 (Fütüristik Tema) ===
        <div className={`${WIDGET_BASE_CLASSES} flex flex-col h-[600px] max-h-[80vh]`}>
            <h3 className={WIDGET_HEADER_CLASSES}>
                <BrainCircuit className="w-5 h-5 mr-3 text-cyan-400" />
                <span className="text-gray-200 text-lg font-semibold">Synara Asistan (METIS)</span>
            </h3>

            {/* (v4.0) Chat Alanı */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto mt-3 space-y-4 pr-2 custom-scrollbar">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <BrainCircuit className="w-6 h-6 mr-2 text-cyan-400 flex-shrink-0" />}
                        <div 
                            className={`relative p-3 rounded-lg max-w-xs md:max-w-sm ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-gray-700/50 text-gray-200'
                            }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            
                            {msg.role === 'model' && !msg.text.includes('Bağlantı Hatası') && (
                                <button 
                                    onClick={() => copyToClipboard(msg.text, index)}
                                    className="absolute -top-2 -right-2 p-1 bg-gray-600 rounded-full text-gray-300 hover:bg-indigo-500 hover:text-white transition-colors"
                                    title="Yanıtı kopyala"
                                >
                                    {hasCopied === index ? (
                                        <Check className="w-3 h-3" />
                                    ) : (
                                        <Copy className="w-3 h-3" />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {aiMutation.isLoading && (
                    <div className="flex justify-start">
                        <BrainCircuit className="w-6 h-6 mr-2 text-cyan-400 flex-shrink-0" />
                        <div className="p-3 rounded-lg bg-gray-700/50 text-gray-200">
                            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                        </div>
                    </div>
                )}
            </div>

            {/* (v4.0) Input Alanı */}
            <form onSubmit={handleSendMessage} className="mt-4 flex items-center space-x-2 flex-shrink-0">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={aiMutation.isLoading ? "Yanıt hazırlanıyor..." : "Piyasa durumunu sor..."}
                    disabled={aiMutation.isLoading}
                    className="flex-1 p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                    type="submit" 
                    disabled={aiMutation.isLoading || !message.trim()}
                    className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default SynaraAssistantWidget;
