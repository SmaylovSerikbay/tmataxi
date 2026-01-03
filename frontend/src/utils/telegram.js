export function initTelegramWebApp() {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
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

