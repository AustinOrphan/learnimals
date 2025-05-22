// UI Utilities
// Common UI utility functions that can be used across the site

/**
 * Create a floating toast notification
 * @param {Object} options - Notification options
 * @param {string} options.message - Notification message text
 * @param {string} [options.type='info'] - Type of notification ('info', 'success', 'warning', 'error')
 * @param {number} [options.duration=3000] - Duration in ms to show the notification
 * @param {boolean} [options.dismissable=true] - Whether the notification can be dismissed by clicking
 * @returns {HTMLElement} - The created notification element
 */
export function showToast(options) {
  const { 
    message, 
    type = 'info', 
    duration = 3000, 
    dismissable = true 
  } = options;

  // Create container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-message">${message}</span>
      ${dismissable ? '<button class="toast-close" aria-label="Close">&times;</button>' : ''}
    </div>
  `;

  // Add to container
  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Close handler
  const close = () => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    
    // Remove after animation
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
      
      // Remove container if empty
      if (container.children.length === 0) {
        document.body.removeChild(container);
      }
    }, 300); // Match transition duration in CSS
  };

  // Add close handler
  if (dismissable) {
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }
    
    // Close on click anywhere on the toast
    toast.addEventListener('click', (e) => {
      if (e.target !== closeBtn) {
        close();
      }
    });
  }

  // Auto-close after duration
  if (duration > 0) {
    setTimeout(close, duration);
  }

  return toast;
}

/**
 * Toggle an element's visibility
 * @param {string|HTMLElement} element - Element or selector to toggle
 * @param {boolean} [show] - Force show or hide, or toggle if undefined
 */
export function toggleElement(element, show) {
  const el = typeof element === 'string' 
    ? document.querySelector(element) 
    : element;
    
  if (!el) return;
  
  const isVisible = el.style.display !== 'none' && el.style.visibility !== 'hidden';
  
  // Determine whether to show or hide
  const shouldShow = show !== undefined ? show : !isVisible;
  
  if (shouldShow) {
    el.style.display = '';
    el.style.visibility = '';
    // Reset display to its default or specified value
    if (el.dataset.displayValue) {
      el.style.display = el.dataset.displayValue;
    }
  } else {
    // Store original display value if not already stored
    if (!el.dataset.displayValue && el.style.display !== 'none') {
      el.dataset.displayValue = el.style.display || '';
    }
    el.style.display = 'none';
  }
}

/**
 * Throttle a function call
 * @param {Function} func - Function to throttle
 * @param {number} limit - Throttle limit in ms
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
  let inThrottle = false;
  
  return function(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Format a number with specified options
 * @param {number} num - Number to format
 * @param {Object} options - Formatting options
 * @param {string} [options.style='decimal'] - Number style ('decimal', 'currency', 'percent')
 * @param {string} [options.currency='USD'] - Currency code for currency style
 * @param {number} [options.minimumFractionDigits] - Min fraction digits
 * @param {number} [options.maximumFractionDigits] - Max fraction digits
 * @returns {string} - Formatted number
 */
export function formatNumber(num, options = {}) {
  const defaultOptions = {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  };
  
  const opts = { ...defaultOptions, ...options };
  
  try {
    return new Intl.NumberFormat(undefined, opts).format(num);
  } catch (error) {
    console.error('Number formatting error:', error);
    return num.toString();
  }
}

/**
 * Format a date with specified options
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Formatting options
 * @param {string} [options.format='short'] - Predefined format ('short', 'long', 'full', 'time')
 * @returns {string} - Formatted date
 */
export function formatDate(date, options = {}) {
  const { format = 'short' } = options;
  
  // Convert to Date object if needed
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }
  
  try {
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString();
      case 'long':
        return dateObj.toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'time':
        return dateObj.toLocaleTimeString();
      case 'full':
        return dateObj.toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return dateObj.toLocaleDateString();
    }
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
}

/**
 * Create an accessible tab interface
 * @param {string|HTMLElement} container - Container element or selector
 * @param {Object} options - Tab options
 * @param {Function} [options.onTabChange] - Callback when active tab changes
 * @returns {Object} - Tab API
 */
export function createTabs(container, options = {}) {
  const containerEl = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
    
  if (!containerEl) {
    console.error('Tab container not found:', container);
    return null;
  }
  
  const tabList = containerEl.querySelector('[role="tablist"]');
  if (!tabList) {
    console.error('No tablist found in container');
    return null;
  }
  
  const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
  const panels = tabs.map(tab => {
    const panelId = tab.getAttribute('aria-controls');
    return document.getElementById(panelId);
  });
  
  // Set initial active tab
  let activeIndex = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
  if (activeIndex === -1) activeIndex = 0;
  
  // Activate a tab
  function activateTab(index) {
    // Deactivate all tabs
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', i === index ? 'true' : 'false');
      tab.setAttribute('tabindex', i === index ? '0' : '-1');
    });
    
    // Hide all panels
    panels.forEach((panel, i) => {
      if (panel) {
        panel.hidden = i !== index;
      }
    });
    
    // Update active index
    activeIndex = index;
    
    // Call callback
    if (options.onTabChange) {
      options.onTabChange(index, tabs[index], panels[index]);
    }
  }
  
  // Set up initial state
  activateTab(activeIndex);
  
  // Add click listeners
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      activateTab(i);
    });
    
    // Keyboard navigation
    tab.addEventListener('keydown', (e) => {
      let newIndex;
      
      switch (e.key) {
        case 'ArrowRight':
          newIndex = (activeIndex + 1) % tabs.length;
          break;
        case 'ArrowLeft':
          newIndex = (activeIndex - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }
      
      activateTab(newIndex);
      tabs[newIndex].focus();
      e.preventDefault();
    });
  });
  
  // Return API
  return {
    activateTab,
    getActiveIndex: () => activeIndex,
    getTabs: () => tabs,
    getPanels: () => panels
  };
}
