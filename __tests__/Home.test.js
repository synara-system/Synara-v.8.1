// path: __tests__/Home.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HeroClient } from '@/components/home/HeroAndStatsClient';
import { translations } from '@/data/translations';
import { AuthProvider } from '@/context/AuthContext';

// KRİTİK FİX: Firebase initialization hatasını çözmek için mocklama.
// Jest, test ortamında Firebase'i başlatmaya çalıştığında NEXT_PUBLIC_FIREBASE_API_KEY'e ulaşamaz
// veya tarayıcı ortamı (JSDOM) nedeniyle hata verir. Bu nedenle, gerekli modülleri taklit ediyoruz.

// 1. Firebase core ve service getter'larını mock'la
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ /* mock app instance */ })),
  getApps: jest.fn(() => ([])),
  getApp: jest.fn(() => ({ /* mock app instance */ })),
}));

// 2. Firebase service modüllerini mock'la
jest.mock('firebase/auth', () => ({
  // useSynaraAuth hook'unda kullanılan temel fonksiyonları mock'la
  getAuth: jest.fn(() => ({ /* mock auth instance */ })),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signOut: jest.fn(),
  // Home.test.js'in dolaylı olarak çağırdığı diğer auth fonksiyonları
  signInWithEmailAndPassword: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  // useSynaraAuth ve context'te kullanılan temel fonksiyonları mock'la
  getFirestore: jest.fn(() => ({ /* mock firestore instance */ })),
  doc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  setDoc: jest.fn(),
  // KRİTİK DÜZELTME: Syntax Error'ı çözmek için boş obje döndürme yapısı kullanıldı.
  serverTimestamp: jest.fn(() => ({ /* mock timestamp */ })), 
}));

// 3. firebase.js'i mock'la (AuthContext'in kullandığı temel export'lar)
jest.mock('@/firebase', () => ({
  auth: { /* mock auth instance */ },
  db: { /* mock db instance */ },
}));


// useAuth hook'unu mock'lamak için (Zaten mevcuttu, ancak emin olmak için kalsın)
jest.mock('@/context/AuthContext', () => ({
  ...jest.requireActual('@/context/AuthContext'),
  useAuth: () => ({
    T: translations.tr,
    user: null,
    loading: false,
    isAdmin: false,
    isApproved: false,
    subscriptionEndDate: null,
    userData: {},
    handleLogout: jest.fn(),
  }),
}));

describe('HeroClient Component', () => {
  it('renders the main heading correctly', () => {
    // AuthProvider ile sarmalayarak context'in sağlanmasını sağlıyoruz.
    render(
      <AuthProvider initialTranslations={translations.tr}>
        <HeroClient T={translations.tr} />
      </AuthProvider>
    );

    const heading = screen.getByRole('heading', {
      name: /Piyasa Karmaşasını Tek Bir Karara İndirgeyin/i,
    });

    expect(heading).toBeInTheDocument();
  });
});
