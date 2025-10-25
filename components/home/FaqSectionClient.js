// path: components/home/FaqSectionClient.js
'use client';

import React from 'react';
import { motion } from 'framer-motion'; 
import Icon from '@/components/Icon';

const FaqItem = ({ q, a, index }) => (
  <motion.details 
      className="bg-gray-800/50 p-5 rounded-xl cursor-pointer transition-all duration-300 group border border-gray-700 hover:border-yellow-500/50 shadow-md"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      open={index === 0}
  >
    <summary 
        className="list-none flex justify-between items-center font-semibold text-white transition-colors duration-300 group-hover:text-yellow-400"
    >
      <span className="text-base flex items-center gap-3">
         <Icon name="help-circle" className="w-5 h-5 text-indigo-400 group-hover:text-yellow-400 flex-shrink-0" aria-hidden="true" />
         {q}
      </span>
      <Icon name="chevron-down" className="w-5 h-5 text-indigo-400 arrow-down transition-transform duration-300 group-open:rotate-180 flex-shrink-0 ml-4" aria-hidden="true" />
    </summary>
    <p 
        className="text-gray-400 mt-4 leading-relaxed border-t border-gray-700 pt-4 text-sm" 
        dangerouslySetInnerHTML={{ __html: a }}
        id={`faq-answer-${index}`}
    ></p>
  </motion.details>
);

const FaqSectionClient = ({ T }) => {
  const faqs = [
    { q: "Synara sinyalleri geriye dönük değişir mi (Repaint İllüzyonu)?", a: "**Kesinlikle Hayır.** Synara&apos;nın çekirdek felsefesi olan **Anchor TF Kapanış Protokolü** sayesinde sinyallerimiz bar kapandıktan sonra mühürlenir ve bu karar teknik olarak değiştirilemez. **Repaint sorununa karşı kurumsal garantidir.**" },
    { q: "Synara&apos;nın performansı geçmiş verilerle mi hesaplanmıştır?", a: "Hayır. Performans ve simülasyonlarımız, **canlı piyasa koşullarına** göre ayarlanmış, **Holistic Intelligence Matrix (HIM)** yapısına dayanır. Geçmiş veriye değil, anlık teyitli disipline odaklanıyoruz." },
    { q: "Aboneliğimi dilediğim zaman iptal edebilir miyim?", a: "Evet. Aboneliğinizi dilediğiniz zaman, herhangi bir ek taahhüt olmaksızın iptal edebilirsiniz. Erişiminiz, ödemesini yaptığınız dönemin sonuna kadar devam edecektir." },
    { q: "Synara Engine hangi piyasalarda (Kripto, Forex vb.) çalışır?", a: "Synara, piyasadan bağımsız, **saf fiyat hareketi ve likidite** mantığı üzerine kurulmuştur. Bu sayede **kripto, forex, emtia ve hisse senedi** piyasalarında aynı disiplinle çalışır." },
  ];

  return (
    <motion.section 
        id="faq" 
        className="py-20 bg-gray-900/50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h3 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">{T.faq_title}</h3>
                <p className="text-gray-400 text-center mb-10 text-lg">
                    Synara Engine&apos;in disiplinli mimarisi hakkında aklınıza takılan temel sorular.
                </p>
            </motion.div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default FaqSectionClient;
