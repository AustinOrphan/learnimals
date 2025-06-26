/**
 * PWA Installation Component for Enhanced Mobile Experience
 * Provides app installation prompts and mobile-specific optimizations
 */
import logger from '../../utils/logger.js';

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.setupInstallationPrompt();
    this.setupMobileOptimizations();
  }

  setupInstallationPrompt() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hideInstallButton();
      this.showWelcomeMessage();
    });

    // Check if app is already installed
    if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  setupMobileOptimizations() {
    // Add viewport height fix for mobile browsers
    this.addViewportHeightFix();

    // Add touch feedback for better UX
    this.addTouchFeedback();

    // Add orientation change handling
    this.addOrientationHandling();

    // Add mobile keyboard optimizations
    this.addMobileKeyboardOptimizations();
  }

  showInstallButton() {
    // Create install button if it doesn't exist
    if (!document.getElementById('pwa-install-button')) {
      const installButton = document.createElement('button');
      installButton.id = 'pwa-install-button';
      installButton.className = 'pwa-install-btn';
      installButton.innerHTML = `
                <span class="install-icon">📱</span>
                <span class="install-text">Install App</span>
            `;

      // Add styles - match theme button height
      installButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                color: white;
                border: none;
                border-radius: 24px;
                padding: 0 16px;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 1000;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                height: 48px;
                backdrop-filter: blur(10px);
            `;

      installButton.addEventListener('click', () => this.promptInstall());
      document.body.appendChild(installButton);

      // Add responsive styles to match theme button heights
      const style = document.createElement('style');
      style.textContent = `
                @media (max-width: 768px) {
                    #pwa-install-button {
                        height: 48px !important;
                        font-size: 13px !important;
                        border-radius: 24px !important;
                        bottom: 16px !important;
                        left: 16px !important;
                    }
                }
                @media (max-width: 480px) {
                    #pwa-install-button {
                        height: 44px !important;
                        font-size: 12px !important;
                        border-radius: 22px !important;
                        bottom: 15px !important;
                        left: 15px !important;
                        padding: 0 12px !important;
                        gap: 6px !important;
                    }
                }
            `;
      document.head.appendChild(style);

      // Add hover effects
      installButton.addEventListener('mouseenter', () => {
        installButton.style.transform = 'scale(1.05) translateY(-2px)';
        installButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
      });

      installButton.addEventListener('mouseleave', () => {
        installButton.style.transform = 'scale(1) translateY(0)';
        installButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      });
    }
  }

  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.opacity = '0';
      installButton.style.transform = 'translateY(100px)';
      setTimeout(() => installButton.remove(), 300);
    }
  }

  async promptInstall() {
    if (!this.deferredPrompt) {return;}

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await this.deferredPrompt.userChoice;
    logger.debug(`User response to the install prompt: ${outcome}`);

    // Clear the deferredPrompt
    this.deferredPrompt = null;
    this.hideInstallButton();
  }

  showWelcomeMessage() {
    // Show a welcome message after installation
    const welcomeToast = document.createElement('div');
    welcomeToast.className = 'pwa-welcome-toast';
    welcomeToast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">🎉</span>
                <span class="toast-message">Welcome to Learnimals! App installed successfully.</span>
            </div>
        `;

    welcomeToast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-card);
            color: var(--text-primary);
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px var(--shadow-color);
            z-index: 1001;
            opacity: 0;
            transition: opacity 0.3s ease;
            border: 1px solid var(--accent-primary);
        `;

    document.body.appendChild(welcomeToast);

    // Animate in
    setTimeout(() => {
      welcomeToast.style.opacity = '1';
    }, 100);

    // Remove after 4 seconds
    setTimeout(() => {
      welcomeToast.style.opacity = '0';
      setTimeout(() => welcomeToast.remove(), 300);
    }, 4000);
  }

  addViewportHeightFix() {
    // Fix for mobile viewport height issues (iOS Safari, etc.)
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
  }

  addTouchFeedback() {
    // Add haptic feedback for supported devices
    const addHapticFeedback = (element, intensity = 'light') => {
      element.addEventListener('touchstart', () => {
        if (window.navigator.vibrate) {
          // Provide subtle vibration feedback
          const vibrationPattern = {
            light: [10],
            medium: [15],
            heavy: [25]
          };
          window.navigator.vibrate(vibrationPattern[intensity] || vibrationPattern.light);
        }
      });
    };

    // Add haptic feedback to buttons
    document.addEventListener('DOMContentLoaded', () => {
      const buttons = document.querySelectorAll('button, .btn, .theme-button');
      buttons.forEach(button => addHapticFeedback(button, 'light'));
    });
  }

  addOrientationHandling() {
    // Handle device orientation changes
    const handleOrientationChange = () => {
      // Add small delay to ensure viewport updates
      setTimeout(() => {
        // Trigger resize event for components that need it
        window.dispatchEvent(new Event('resize'));

        // Update any game canvases
        const gameCanvases = document.querySelectorAll('#gameCanvas');
        gameCanvases.forEach(canvas => {
          if (canvas.resizeCanvas) {
            canvas.resizeCanvas();
          }
        });
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    screen.orientation?.addEventListener('change', handleOrientationChange);
  }

  addMobileKeyboardOptimizations() {
    // Handle mobile keyboard appearance/disappearance
    let initialViewportHeight = window.innerHeight;

    const handleViewportChange = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;

      // If viewport height reduced significantly, keyboard is probably open
      if (heightDifference > 150) {
        document.body.classList.add('keyboard-open');
        // Only hide PWA install button, keep theme switcher accessible
        const pwaButton = document.querySelector('#pwa-install-button');
        if (pwaButton) {
          pwaButton.style.opacity = '0.3';
          pwaButton.style.pointerEvents = 'none';
        }
        // Move theme switcher up slightly to avoid keyboard
        const themeSwitcher = document.querySelector('.theme-switcher-container');
        if (themeSwitcher) {
          themeSwitcher.style.transform = 'translateY(-60px)';
        }
      } else {
        document.body.classList.remove('keyboard-open');
        // Restore PWA install button
        const pwaButton = document.querySelector('#pwa-install-button');
        if (pwaButton) {
          pwaButton.style.opacity = '1';
          pwaButton.style.pointerEvents = 'auto';
        }
        // Reset theme switcher position
        const themeSwitcher = document.querySelector('.theme-switcher-container');
        if (themeSwitcher) {
          themeSwitcher.style.transform = 'translateY(0)';
        }
      }
    };

    window.addEventListener('resize', handleViewportChange);

    // Reset on page load
    window.addEventListener('load', () => {
      initialViewportHeight = window.innerHeight;
    });
  }

  // Public method to check if app is installable
  isInstallable() {
    return this.deferredPrompt !== null;
  }

  // Public method to check if app is installed
  isAppInstalled() {
    return this.isInstalled;
  }
}

// Initialize PWA installer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pwaInstaller = new PWAInstaller();
});

export default PWAInstaller;