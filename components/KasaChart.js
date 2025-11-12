// path: components/KasaChart.js
'use client';

import React from 'react';
// KRİTİK DÜZELTME: LineChart yerine AreaChart ve Line yerine Area kullanıldı
import { AreaChart } from 'recharts/lib/chart/AreaChart';
import { Area } from 'recharts/lib/cartesian/Area';
import { XAxis } from 'recharts/lib/cartesian/XAxis';
import { YAxis } from 'recharts/lib/cartesian/YAxis';
import { CartesianGrid } from 'recharts/lib/cartesian/CartesianGrid';
import { Tooltip } from 'recharts/lib/component/Tooltip';
import { ResponsiveContainer } from 'recharts/lib/component/ResponsiveContainer';
import Icon from './Icon'; 


// Dot bileşeni, cashflow (nakit akışı) işlemlerini farklı ikonlarla gösterir.
// KRİTİK GÜNCELLEME: CustomDot, Line bileşeninin dot prop'u olarak kullanılacak şekilde uyarlandı.
const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    
    // Yalnızca Cashflow işlemleri için özel nokta çiz
    if (payload.type === 'cashflow') {
        const isDeposit = payload.direction === 'D'; 
        const color = isDeposit ? '#10B981' : '#F87171'; // Green: Deposit, Red: Withdraw
        const iconName = isDeposit ? 'plus' : 'minus';
        const size = 18;

        return (
            <svg x={cx - size/2} y={cy - size/2} width={size} height={size} viewBox="0 0 24 24" key={payload.id || `dot-${cx}-${cy}`} fill="none" stroke={color}>
                {/* Dış Halka */}
                <circle cx="12" cy="12" r="11" strokeWidth="2" /> 
                {/* İkon (Icon.js'den gelen SVG path'leri burada tekrar çağrılmaz) */}
                {/* İçi boş kalması için Icon'un kendisi yerine basit SVG kullanıldı */}
                <path d={iconName === 'plus' ? "M12 5v14M5 12h14" : "M5 12h14"} stroke={color} strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }
    
    // Normal Trade noktaları (Ana çizgi üzerindeki standart nokta)
    // Sadece kayıp/kazanç olan trade'ler için özel bir renk verilebilir.
    if (payload.type === 'trade' && payload.pnl !== 0) {
        const isWin = payload.pnl > 0;
        const color = isWin ? '#10B981' : '#F87171';
        return <circle cx={cx} cy={cy} r={4} stroke={color} strokeWidth={2} fill="#1F2937" key={payload.id || `dot-${cx}-${cy}`} />;
    }
    
    // Başlangıç noktası veya nötr noktalar
    return <circle cx={cx} cy={cy} r={4} stroke="#818CF8" strokeWidth={2} fill="#1F2937" key={payload.id || `dot-${cx}-${cy}`} />;
};

// Özel Tooltip içeriği
const CustomTooltip = ({ active, payload, label, translations }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const T = translations || {};
        
        // KRİTİK DÜZELTME A.2: Date objesini ISO string'den alıp formatla
        const formattedDate = data.id === 'start-point' 
            ? (T.kasa_baslangic || 'Başlangıç') 
            : new Date(data.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
        
        // Cashflow veya Trade bilgisini göster
        let pnlDisplay = '';
        if (data.type === 'cashflow') {
            const typeText = data.direction === 'D' ? T.kasa_deposit : T.kasa_withdraw;
            // KRİTİK FİX 1: Para işaretini kaldırdım
            pnlDisplay = `${typeText}: ${Math.abs(data.pnl).toFixed(2)}$`; 
        } else if (data.type === 'trade') {
            // KRİTİK FİX 1: Para işaretini kaldırdım
            pnlDisplay = `PnL: ${Math.abs(data.pnl).toFixed(2)}$`; 
        } else if (data.id === 'start-point') {
             pnlDisplay = '---';
        }
        
        return (
            <div className="bg-gray-900/80 backdrop-blur-sm p-3 rounded-lg border border-gray-700 text-xs shadow-xl">
                <p className="font-bold text-white mb-1">{formattedDate}</p>
                <p className="text-indigo-400">Bakiye: <span className="font-semibold">${payload[0].value.toFixed(2)}</span></p>
                <p className={`font-semibold ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pnlDisplay}
                </p>
            </div>
        );
    }
    return null;
};


const KasaChart = ({ chartData, translations }) => {
    
    const formatXAxis = (tickItem) => {
        // KRİTİK DÜZELTME A.2: Sadece Başlangıç noktasını tam metin, diğerlerini kısaltılmış tarih göster.
        if (tickItem === (translations.kasa_baslangic || 'Başlangıç')) return tickItem;
        try {
            return new Date(tickItem).toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' });
        } catch (e) {
            return '---';
        }
    };
    
    // chartData'daki `date` alanını X ekseni için kullanıyoruz.
    // Başlangıç noktası için özel bir değer (`translations.kasa_baslangic`) kullanılıyor.
    const finalChartData = chartData.map(item => ({
        ...item,
        // Eğer 'start-point' ise, X ekseni için kullanacağı değeri baslangic metni yap.
        date_label: item.id === 'start-point' ? (translations.kasa_baslangic || 'Başlangıç') : item.date, 
    }));

    return (
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={finalChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                {/* KRİTİK DÜZELTME: XAxis, date_label'ı kullanıyor. */}
                <XAxis 
                    dataKey="date_label" 
                    stroke="#9CA3AF" 
                    fontSize={12} 
                    minTickGap={20}
                    // KRİTİK DÜZELTME A.2: Tick formatlayıcısı artık ISO stringleri alıp formatlayacak.
                    // date_label'ın kendisi Başlangıç metni veya ISO string olduğu için bu mantık çalışır.
                    tickFormatter={(value) => {
                        return value === (translations.kasa_baslangic || 'Başlangıç') ? value : formatXAxis(value);
                    }}
                />
                <YAxis 
                    stroke="#9CA3AF" 
                    fontSize={12} 
                    // Grafiğin başlangıç ve bitiş noktalarını daha dinamik hale getiriyoruz.
                    domain={['dataMin', 'dataMax']} 
                    tickFormatter={(value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} 
                    // KRİTİK DÜZELTME A.2: CustomTooltip'e translations prop'u aktarılıyor
                    content={<CustomTooltip translations={translations} />}
                    labelFormatter={(value) => {
                         // Tooltip başlığı için sadece X ekseni etiketini kullanıyoruz.
                         // CustomTooltip içeriği bu değeri işleyecek.
                         return value; 
                    }}
                />
                
                <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818CF8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#818CF8" stopOpacity={0.1}/>
                    </linearGradient>
                </defs>

                {/* Ana Bakiye Alanı (Area Chart) */}
                <Area 
                    type="monotone" 
                    dataKey="balance" 
                    name={translations.kasa_current_balance || 'Bakiye'}
                    stroke="#818CF8" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                    dot={<CustomDot />}
                    activeDot={{ r: 6, fill: '#818CF8', stroke: '#1F2937', strokeWidth: 2 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default KasaChart;
