import { create } from 'zustand';

export type Lang = 'fr' | 'en';

interface LanguageState {
  lang: Lang;
  toggleLang: () => void;
}

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${value};path=/;domain=${window.location.hostname}`;
  document.cookie = `${name}=${value};path=/`; // Fallback for localhost
};

export const useLanguageStore = create<LanguageState>((set) => ({
  lang: (getCookie('googtrans') === '/fr/en') ? 'en' : 'fr',
  toggleLang: () => {
    set((state) => {
      const newLang = state.lang === 'fr' ? 'en' : 'fr';
      
      if (newLang === 'en') {
        setCookie('googtrans', '/fr/en');
      } else {
        setCookie('googtrans', '/fr/fr');
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
      
      // Essayer de déclencher la traduction Google sans rafraîchir la page
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (selectElement) {
        selectElement.value = newLang;
        selectElement.dispatchEvent(new Event('change'));
      } else {
        // Fallback si le script n'est pas encore chargé (rare)
        window.location.reload();
      }
      
      return { lang: newLang };
    });
  },
}));
