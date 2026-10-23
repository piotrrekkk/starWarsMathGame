// Progressive Web App (PWA) Registration & Install Manager

let deferredPrompt = null;

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered with scope:', registration.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });
}

// Handle PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;

  const btnInstall = document.getElementById('btn-install-pwa');
  if (btnInstall) {
    btnInstall.classList.remove('hidden');
  }
});

window.addEventListener('appinstalled', () => {
  console.log('[PWA] Aplikacja zainstalowana pomyślnie!');
  deferredPrompt = null;
  const btnInstall = document.getElementById('btn-install-pwa');
  if (btnInstall) {
    btnInstall.classList.add('hidden');
  }
});

// Setup click handler for install button
document.addEventListener('DOMContentLoaded', () => {
  const btnInstall = document.getElementById('btn-install-pwa');
  const modalIosInstall = document.getElementById('modal-ios-install');
  const btnCloseIos = document.getElementById('btn-close-ios-modal');

  // Detect iOS Safari
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  // On iOS, if not already installed, show button that explains how to add to home screen
  if (isIos && !isStandalone && btnInstall) {
    btnInstall.classList.remove('hidden');
  }

  if (btnInstall) {
    btnInstall.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User response to install prompt: ${outcome}`);
        deferredPrompt = null;
        btnInstall.classList.add('hidden');
      } else if (isIos && modalIosInstall) {
        modalIosInstall.classList.remove('hidden');
      }
    });
  }

  if (btnCloseIos && modalIosInstall) {
    btnCloseIos.addEventListener('click', () => {
      modalIosInstall.classList.add('hidden');
    });
  }
});
