export function initTelegramWebApp() {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    try {
      // Sync app theme with Telegram (light/dark) to keep UI consistent
      const scheme = tg.colorScheme === 'light' ? 'light' : 'dark';
      document.documentElement.dataset.theme = scheme;
    } catch (e) {
      // ignore
    }
    return tg;
  }
  return null;
}

export function getTelegramUser() {
  if (window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe?.user;
  }
  return null;
}

