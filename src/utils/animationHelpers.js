/**
 * Animation Helpers Utility
 * Provides easy-to-use animation methods for profile components
 */

class AnimationHelpers {
  constructor() {
    this.animationQueue = [];
    this.isAnimating = false;
  }

  /**
   * Add entrance animation to element
   * @param {HTMLElement} element - Element to animate
   * @param {string} type - Animation type (fadeIn, slideIn, bounceIn, etc.)
   * @param {Object} options - Animation options
   */
  animateIn(element, type = 'fadeIn', options = {}) {
    if (!element) return Promise.resolve();

    const {
      delay = 0,
      duration = null,
      onComplete = null,
      removeAfterAnimation = false
    } = options;

    return new Promise((resolve) => {
      // Apply animation class
      element.classList.add(`animate-${type}`);
      
      // Set custom duration if provided
      if (duration) {
        element.style.animationDuration = `${duration}ms`;
      }

      // Handle delay
      if (delay > 0) {
        element.style.animationDelay = `${delay}ms`;
      }

      // Listen for animation end
      const handleAnimationEnd = () => {
        element.removeEventListener('animationend', handleAnimationEnd);
        
        if (removeAfterAnimation) {
          element.classList.remove(`animate-${type}`);
        }
        
        // Reset custom styles
        if (duration) element.style.animationDuration = '';
        if (delay > 0) element.style.animationDelay = '';
        
        if (onComplete) onComplete();
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd);
    });
  }

  /**
   * Add exit animation to element
   * @param {HTMLElement} element - Element to animate
   * @param {string} type - Animation type
   * @param {Object} options - Animation options
   */
  animateOut(element, type = 'fadeOut', options = {}) {
    if (!element) return Promise.resolve();

    const {
      delay = 0,
      duration = 300,
      onComplete = null,
      removeElement = false
    } = options;

    return new Promise((resolve) => {
      // Create reverse animation
      element.style.animation = `${type} ${duration}ms ease-out ${delay}ms both reverse`;

      const handleAnimationEnd = () => {
        element.removeEventListener('animationend', handleAnimationEnd);
        
        if (removeElement && element.parentNode) {
          element.parentNode.removeChild(element);
        }
        
        if (onComplete) onComplete();
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd);
    });
  }

  /**
   * Animate number counting up
   * @param {HTMLElement} element - Element containing the number
   * @param {number} from - Starting number
   * @param {number} to - Target number
   * @param {Object} options - Animation options
   */
  animateNumber(element, from, to, options = {}) {
    if (!element) return Promise.resolve();

    const {
      duration = 1000,
      formatter = (num) => Math.floor(num),
      onUpdate = null,
      onComplete = null
    } = options;

    return new Promise((resolve) => {
      const startTime = performance.now();
      const difference = to - from;

      const updateNumber = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = from + (difference * easedProgress);
        
        element.textContent = formatter(currentValue);
        
        if (onUpdate) onUpdate(currentValue, progress);

        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          element.textContent = formatter(to);
          if (onComplete) onComplete();
          resolve();
        }
      };

      requestAnimationFrame(updateNumber);
    });
  }

  /**
   * Animate progress bar filling
   * @param {HTMLElement} progressBar - Progress bar element
   * @param {number} targetPercent - Target percentage (0-100)
   * @param {Object} options - Animation options
   */
  animateProgress(progressBar, targetPercent, options = {}) {
    if (!progressBar) return Promise.resolve();

    const {
      duration = 1200,
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
      onComplete = null
    } = options;

    return new Promise((resolve) => {
      // Ensure we have a fill element
      let fillElement = progressBar.querySelector('.progress-fill');
      if (!fillElement) {
        fillElement = progressBar;
      }

      // Set transition
      fillElement.style.transition = `width ${duration}ms ${easing}`;
      fillElement.style.width = `${Math.max(0, Math.min(100, targetPercent))}%`;

      // Listen for transition end
      const handleTransitionEnd = () => {
        fillElement.removeEventListener('transitionend', handleTransitionEnd);
        if (onComplete) onComplete();
        resolve();
      };

      fillElement.addEventListener('transitionend', handleTransitionEnd);

      // Fallback timeout
      setTimeout(() => {
        fillElement.removeEventListener('transitionend', handleTransitionEnd);
        if (onComplete) onComplete();
        resolve();
      }, duration + 100);
    });
  }

  /**
   * Stagger animation for multiple elements
   * @param {NodeList|Array} elements - Elements to animate
   * @param {string} animationType - Animation type
   * @param {Object} options - Animation options
   */
  staggerAnimation(elements, animationType = 'fadeInUp', options = {}) {
    if (!elements || elements.length === 0) return Promise.resolve();

    const {
      staggerDelay = 100,
      baseDelay = 0,
      onEachComplete = null,
      onAllComplete = null
    } = options;

    const promises = [];

    Array.from(elements).forEach((element, index) => {
      const delay = baseDelay + (index * staggerDelay);
      
      const promise = this.animateIn(element, animationType, {
        delay,
        onComplete: () => {
          if (onEachComplete) onEachComplete(element, index);
        }
      });

      promises.push(promise);
    });

    return Promise.all(promises).then(() => {
      if (onAllComplete) onAllComplete();
    });
  }

  /**
   * Add hover effect to element
   * @param {HTMLElement} element - Element to add hover effect
   * @param {string} effectType - Type of hover effect
   * @param {Object} options - Effect options
   */
  addHoverEffect(element, effectType = 'lift') {
    if (!element) return;

    const className = `hover-${effectType}`;
    element.classList.add(className);

    // Add hardware acceleration for smooth animations
    element.classList.add('hardware-accelerated');
  }

  /**
   * Add click/tap effect to element
   * @param {HTMLElement} element - Element to add click effect
   * @param {string} effectType - Type of click effect
   * @param {Object} options - Effect options
   */
  addClickEffect(element, effectType = 'shrink', options = {}) {
    if (!element) return;

    const {
      onTap = null
    } = options;

    const className = `click-${effectType}`;
    element.classList.add(className);

    // Add tap handler for mobile
    if ('ontouchstart' in window) {
      element.classList.add('mobile-tap');
    }

    if (onTap) {
      element.addEventListener('click', onTap);
    }
  }

  /**
   * Create loading animation
   * @param {HTMLElement} element - Element to show loading state
   * @param {string} type - Loading animation type
   * @param {Object} options - Loading options
   */
  showLoading(element, type = 'spinner', options = {}) {
    if (!element) return;

    const {
      text = 'Loading...',
      size = '20px'
    } = options;

    const originalContent = element.innerHTML;
    element.setAttribute('data-original-content', originalContent);

    switch (type) {
    case 'spinner':
      element.innerHTML = `
        <div class="loading-spinner" style="width: ${size}; height: ${size};"></div>
      `;
      break;
    case 'skeleton':
      element.classList.add('skeleton-loader');
      break;
    case 'shimmer':
      element.classList.add('loading');
      break;
    default:
      element.innerHTML = `<span class="loading-text">${text}</span>`;
    }
  }

  /**
   * Hide loading animation
   * @param {HTMLElement} element - Element to hide loading state
   */
  hideLoading(element) {
    if (!element) return;

    const originalContent = element.getAttribute('data-original-content');
    
    if (originalContent) {
      element.innerHTML = originalContent;
      element.removeAttribute('data-original-content');
    }

    element.classList.remove('skeleton-loader', 'loading');
  }

  /**
   * Animate XP gain
   * @param {HTMLElement} container - Container for XP animation
   * @param {number} xpAmount - Amount of XP gained
   * @param {Object} options - Animation options
   */
  animateXPGain(container, xpAmount, options = {}) {
    if (!container) return Promise.resolve();

    const {
      startPosition = { x: 50, y: 50 }, // Percentage from top-left
      endPosition = { x: 50, y: 20 },
      duration = 2000,
      color = '#4ECDC4',
      isMilestone = false
    } = options;

    return new Promise((resolve) => {
      // Create XP element
      const xpElement = document.createElement('div');
      xpElement.className = isMilestone ? 'xp-milestone' : 'xp-gain-number';
      xpElement.textContent = `+${xpAmount} XP`;
      xpElement.style.cssText = `
        position: absolute;
        top: ${startPosition.y}%;
        left: ${startPosition.x}%;
        color: ${color};
        font-weight: bold;
        font-size: ${isMilestone ? '1.5rem' : '1.2rem'};
        pointer-events: none;
        z-index: 1000;
        transform: translate(-50%, -50%);
      `;

      container.style.position = 'relative';
      container.appendChild(xpElement);

      // Animate to end position
      setTimeout(() => {
        xpElement.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        xpElement.style.top = `${endPosition.y}%`;
        xpElement.style.opacity = '0';
        xpElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
      }, 100);

      // Clean up
      setTimeout(() => {
        if (xpElement.parentNode) {
          xpElement.parentNode.removeChild(xpElement);
        }
        resolve();
      }, duration + 200);
    });
  }

  /**
   * Animate level up celebration
   * @param {HTMLElement} element - Element to celebrate
   * @param {Object} options - Celebration options
   */
  celebrateLevelUp(element, options = {}) {
    if (!element) return Promise.resolve();

    const {
      glowDuration = 2000,
      onComplete = null
    } = options;

    return new Promise((resolve) => {
      // Add celebration classes
      element.classList.add('animate-bounce-in', 'animate-glow');

      // Create particle effect
      this.createParticleEffect(element, {
        particleCount: 20,
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1']
      });

      setTimeout(() => {
        element.classList.remove('animate-bounce-in', 'animate-glow');
        if (onComplete) onComplete();
        resolve();
      }, glowDuration);
    });
  }

  /**
   * Create particle effect
   * @param {HTMLElement} container - Container for particles
   * @param {Object} options - Particle options
   */
  createParticleEffect(container, options = {}) {
    const {
      particleCount = 10,
      colors = ['#FFD700', '#FF6B6B', '#4ECDC4'],
      duration = 3000,
      size = 4
    } = options;

    const containerRect = container.getBoundingClientRect();
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        top: ${containerRect.top + containerRect.height / 2}px;
        left: ${containerRect.left + containerRect.width / 2}px;
      `;

      document.body.appendChild(particle);

      // Animate particle
      const angle = (360 / particleCount) * i;
      const velocity = 100 + Math.random() * 100;
      const endX = Math.cos(angle * Math.PI / 180) * velocity;
      const endY = Math.sin(angle * Math.PI / 180) * velocity;

      particle.animate([
        { 
          transform: 'translate(0, 0) scale(1)',
          opacity: 1
        },
        {
          transform: `translate(${endX}px, ${endY}px) scale(0)`,
          opacity: 0
        }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }).finished.then(() => {
        particle.remove();
      });
    }
  }

  /**
   * Queue animation for sequential execution
   * @param {Function} animationFn - Animation function
   * @param {Object} options - Queue options
   */
  queueAnimation(animationFn, options = {}) {
    const {
      priority = 'normal', // 'high', 'normal', 'low'
      delay = 0
    } = options;

    const queueItem = {
      fn: animationFn,
      priority,
      delay,
      timestamp: Date.now()
    };

    // Insert based on priority
    if (priority === 'high') {
      this.animationQueue.unshift(queueItem);
    } else {
      this.animationQueue.push(queueItem);
    }

    this.processQueue();
  }

  /**
   * Process animation queue
   */
  async processQueue() {
    if (this.isAnimating || this.animationQueue.length === 0) {
      return;
    }

    this.isAnimating = true;

    while (this.animationQueue.length > 0) {
      const queueItem = this.animationQueue.shift();
      
      if (queueItem.delay > 0) {
        await this.delay(queueItem.delay);
      }

      try {
        await queueItem.fn();
      } catch (error) {
        console.warn('Animation error:', error);
      }
    }

    this.isAnimating = false;
  }

  /**
   * Clear animation queue
   */
  clearQueue() {
    this.animationQueue = [];
    this.isAnimating = false;
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if animations are enabled (respects user preferences)
   * @returns {boolean} Whether animations should be used
   */
  shouldAnimate() {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get optimal animation duration based on element size and distance
   * @param {HTMLElement} element - Element being animated
   * @param {number} distance - Distance of animation
   * @returns {number} Optimal duration in milliseconds
   */
  getOptimalDuration(element, distance = 0) {
    if (!this.shouldAnimate()) return 0;

    const baseMs = 200;
    const sizeMs = element ? Math.sqrt(element.offsetWidth * element.offsetHeight) * 0.1 : 0;
    const distanceMs = distance * 2;

    return Math.min(Math.max(baseMs + sizeMs + distanceMs, 150), 800);
  }
}

// Create singleton instance
const animationHelpers = new AnimationHelpers();

export default animationHelpers;