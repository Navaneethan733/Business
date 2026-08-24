/**
 * Stackly Premium Preloader Controller
 * Provides an ultra-smooth cinematic loading screen with realistic progress simulation,
 * dynamic status feedback, and an elegant curtain exit animation.
 */
(function() {
  'use strict';

  // Configurable parameters
  const CONFIG = {
    minDisplayTime: 850,     // Minimum duration in ms for cinematic feel
    maxTimeout: 3000,        // Fallback max timeout to ensure user is never blocked
    messages: [
      { threshold: 0, text: 'Initializing platform...' },
      { threshold: 28, text: 'Loading intelligence...' },
      { threshold: 64, text: 'Syncing assets...' },
      { threshold: 88, text: 'Calibrating experience...' },
      { threshold: 99, text: 'Ready' }
    ]
  };

  function initPreloader() {
    let preloader = document.querySelector('.stackly-preloader');
    
    // If not present in HTML, dynamically create and prepend it
    if (!preloader) {
      preloader = document.createElement('div');
      preloader.className = 'stackly-preloader';
      preloader.setAttribute('role', 'status');
      preloader.setAttribute('aria-live', 'polite');
      preloader.setAttribute('aria-label', 'Loading Stackly');
      preloader.innerHTML = `
        <div class="preloader__ambient">
          <div class="preloader__glow-orb preloader__glow-orb--1"></div>
          <div class="preloader__glow-orb preloader__glow-orb--2"></div>
          <div class="preloader__grid"></div>
        </div>
        <div class="preloader__content">
          <div class="preloader__emblem-wrap">
            <div class="preloader__ring--outer"></div>
            <div class="preloader__ring"></div>
            <div class="preloader__ring--pulse"></div>
            <div class="preloader__core">
              <img src="images/Logo.webp" alt="Stackly" class="preloader__logo">
            </div>
          </div>
          <div class="preloader__title">
            <span>STACKLY</span>
          </div>
          <div class="preloader__progress-box">
            <div class="preloader__track">
              <div class="preloader__bar" id="preloaderBar"></div>
            </div>
            <div class="preloader__meta">
              <span class="preloader__status" id="preloaderStatus">
                <span class="preloader__status-dot"></span>
                <span id="preloaderStatusText">Initializing platform...</span>
              </span>
              <span class="preloader__percent" id="preloaderPercent">0%</span>
            </div>
          </div>
        </div>
      `;
      document.body.prepend(preloader);
    }

    const bar = preloader.querySelector('#preloaderBar');
    const percentText = preloader.querySelector('#preloaderPercent');
    const statusText = preloader.querySelector('#preloaderStatusText');

    let currentPercent = 0;
    let targetPercent = 0;
    let isWindowLoaded = false;
    const startTime = performance.now();

    function getMessageForPercent(pct) {
      let currentMsg = CONFIG.messages[0].text;
      for (const msg of CONFIG.messages) {
        if (pct >= msg.threshold) {
          currentMsg = msg.text;
        }
      }
      return currentMsg;
    }

    function updateUI(pct) {
      const rounded = Math.min(100, Math.floor(pct));
      if (bar) bar.style.width = `${rounded}%`;
      if (percentText) percentText.textContent = `${rounded}%`;
      if (statusText) {
        const msg = getMessageForPercent(rounded);
        if (statusText.textContent !== msg) {
          statusText.textContent = msg;
        }
      }
    }

    // Smooth animation loop
    function step() {
      const elapsedTime = performance.now() - startTime;

      if (!isWindowLoaded) {
        // Natural ease towards 85% while assets are downloading
        const progressRatio = Math.min(1, elapsedTime / 1800);
        targetPercent = 15 + Math.sin(progressRatio * (Math.PI / 2)) * 72;
      } else {
        // Window loaded: ensure minimum display time elapsed before hitting 100%
        if (elapsedTime >= CONFIG.minDisplayTime) {
          targetPercent = 100;
        } else {
          targetPercent = 88 + ((elapsedTime / CONFIG.minDisplayTime) * 12);
        }
      }

      // Smooth lerp
      currentPercent += (targetPercent - currentPercent) * 0.18;

      if (Math.abs(currentPercent - targetPercent) < 0.2) {
        currentPercent = targetPercent;
      }

      updateUI(currentPercent);

      if (currentPercent >= 99.8 && isWindowLoaded && (elapsedTime >= CONFIG.minDisplayTime)) {
        updateUI(100);
        finishPreloader();
        return;
      }

      requestAnimationFrame(step);
    }

    function finishPreloader() {
      setTimeout(() => {
        preloader.classList.add('is-loaded');
        document.body.classList.add('page-loaded');

        // Trigger custom loaded event for components
        window.dispatchEvent(new CustomEvent('stackly:ready'));

        // Cleanup DOM after transition completes
        setTimeout(() => {
          if (preloader && preloader.parentNode) {
            preloader.style.display = 'none';
          }
        }, 900);
      }, 160);
    }

    // Window load handler
    if (document.readyState === 'complete') {
      isWindowLoaded = true;
    } else {
      window.addEventListener('load', () => {
        isWindowLoaded = true;
      });
    }

    // Safety timeout fallback
    setTimeout(() => {
      isWindowLoaded = true;
    }, CONFIG.maxTimeout);

    // Kick off animation loop
    requestAnimationFrame(step);
  }

  // Initialize as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreloader);
  } else {
    initPreloader();
  }
})();
