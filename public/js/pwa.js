// Progressive Web App (PWA) Registration & Install Manager

let deferredPrompt = null;

// Register Service Worker if in secure context
if ('serviceWorker' in navigator && (window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        registration.update();
        console.log('[PWA] Service Worker registered with scope:', registration.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });
}

// Handle PWA Native Install Prompt (when available on HTTPS / localhost)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] beforeinstallprompt event captured');
});

window.addEventListener('appinstalled', () => {
  console.log('[PWA] Aplikacja zainstalowana pomyślnie!');
  deferredPrompt = null;
  const btnInstall = document.getElementById('btn-install-pwa');
  if (btnInstall) {
    btnInstall.innerHTML = '✔ Zainstalowano';
    btnInstall.disabled = true;
    btnInstall.style.opacity = '0.6';
  }
});

// Setup click handler for install button
document.addEventListener('DOMContentLoaded', () => {
  const btnInstall = document.getElementById('btn-install-pwa');
  const modalInstall = document.getElementById('modal-install-guide');
  const btnCloseModal = document.getElementById('btn-close-install-modal');

  // Check if running in standalone mode (already installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (isStandalone && btnInstall) {
    btnInstall.classList.add('hidden');
    return;
  }

  // Always show the install button so user can install or see manual instructions
  if (btnInstall) {
    btnInstall.classList.remove('hidden');

    btnInstall.addEventListener('click', async () => {
      // 1. If browser provided native prompt (HTTPS / localhost), trigger it
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User response to install prompt: ${outcome}`);
        deferredPrompt = null;
        if (outcome === 'accepted') {
          btnInstall.classList.add('hidden');
        }
      } else {
        // 2. Over HTTP or iOS Safari, show the manual "Add to Home Screen" instructions
        if (modalInstall) {
          modalInstall.classList.remove('hidden');
        }
      }
    });
  }

  if (btnCloseModal && modalInstall) {
    btnCloseModal.addEventListener('click', () => {
      modalInstall.classList.add('hidden');
    });
  }
});
