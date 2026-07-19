// Modal Component
// Reusable modal component for consistent UI across the site

import BaseComponent from '../BaseComponent.js';

// Inline escapeHTML function to avoid module import
function escapeHTML(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Stack of currently open modals; the last entry is the topmost dialog.
// Used so Escape only closes the topmost modal (WAI-ARIA APG dialog pattern).
const openModalStack = [];

class Modal extends BaseComponent {
  /**
   * Create a modal component
   * @param {Object} options - Modal options
   * @param {string} options.id - Modal ID
   * @param {string} options.title - Modal title
   * @param {string} options.content - Modal content (can be HTML)
   * @param {string} [options.confirmButtonText] - Text for confirm button
   * @param {string} [options.cancelButtonText] - Text for cancel button
   * @param {Function} [options.onConfirm] - Function to call on confirm
   * @param {Function} [options.onCancel] - Function to call on cancel
   * @param {Function} [options.onClose] - Function to call when modal closes
   * @param {boolean} [options.showClose] - Whether to show a close button
   * @param {string} [options.size] - Modal size (small, medium, large)
   */
  constructor(options) {
    super({
      title: options.title || '',
      content: options.content || '',
      confirmButtonText: options.confirmButtonText || 'OK',
      cancelButtonText: options.cancelButtonText || 'Cancel',
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
      onClose: options.onClose || null,
      showClose: options.showClose !== undefined ? options.showClose : true,
      size: options.size || 'medium',
      showConfirmButton: options.showConfirmButton !== undefined ? options.showConfirmButton : true,
      showCancelButton: options.showCancelButton !== undefined ? options.showCancelButton : false,
      ...options,
    });

    this.isOpen = false;
    // Track document-level event listeners separately
    this.documentListeners = new Map();
    this.escapeHandler = null;
    this.previouslyFocused = null;
  }

  /**
   * Generate modal HTML
   * @returns {string} - Modal HTML
   */
  generateHTML() {
    const {
      id,
      title,
      content,
      confirmButtonText,
      cancelButtonText,
      showClose,
      size,
      showConfirmButton,
      showCancelButton,
    } = this.options;

    // Size class
    const sizeClass = `modal--${size}`;

    let html = `
      <div id="${escapeHTML(id)}" class="component modal-overlay" aria-hidden="true">
        <div class="modal ${sizeClass}" role="dialog" aria-labelledby="${escapeHTML(id)}-title" aria-modal="true">
          <div class="modal-header">
            <h3 id="${escapeHTML(id)}-title" class="modal-title">${escapeHTML(title)}</h3>
            ${showClose ? '<button class="modal-close component-button component-button--ghost" aria-label="Close">&times;</button>' : ''}
          </div>
          <div class="modal-content">
            ${content}
          </div>
    `;

    // Only add footer if we have buttons
    if (showConfirmButton || showCancelButton) {
      html += `
        <div class="modal-footer component-flex component-flex--between">
      `;

      if (showCancelButton) {
        html += `
          <button class="modal-cancel component-button component-button--outline">${escapeHTML(cancelButtonText)}</button>
        `;
      }

      if (showConfirmButton) {
        html += `
          <button class="modal-confirm component-button component-button--primary">${escapeHTML(confirmButtonText)}</button>
        `;
      }

      html += `
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Create the modal in the DOM but don't show it
   */
  create() {
    // Create modal element if it doesn't exist
    if (!document.getElementById(this.options.id)) {
      // Create a div to hold the modal
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = this.generateHTML();

      // Append to body
      document.body.appendChild(modalContainer.firstElementChild);

      // Set element reference
      this.element = document.getElementById(this.options.id);
      this.isRendered = true;

      // Attach event listeners
      this.attachEventListeners();
    }

    return this;
  }

  /**
   * Attach event listeners to the modal
   */
  attachEventListeners() {
    // Close button
    this.addEventListener('click', () => this.close(), '.modal-close');

    // Confirm button
    if (this.options.onConfirm) {
      this.addEventListener(
        'click',
        () => {
          this.options.onConfirm();
          this.close();
        },
        '.modal-confirm'
      );
    }

    // Cancel button
    if (this.options.onCancel) {
      this.addEventListener(
        'click',
        () => {
          this.options.onCancel();
          this.close();
        },
        '.modal-cancel'
      );
    }

    // Close on click outside
    this.addEventListener('click', e => {
      if (e.target === this.element) {
        this.close();
      }
    });

    // Trap Tab / Shift+Tab focus inside the dialog (WAI-ARIA APG dialog pattern)
    this.addEventListener('keydown', e => this.handleTabKey(e));

    // Close on Escape key - handled globally, but only for the topmost open modal
    this.escapeHandler = e => {
      if (
        e.key === 'Escape' &&
        this.isOpen &&
        openModalStack[openModalStack.length - 1] === this
      ) {
        this.close();
      }
    };

    // Track document-level event listener
    this.addDocumentEventListener('keydown', this.escapeHandler);
  }

  /**
   * Get the keyboard-focusable elements inside the dialog, in DOM order.
   * Excludes disabled controls, elements removed from the tab order via
   * tabindex="-1", and elements inside hidden containers.
   * @returns {Element[]} - Focusable elements
   */
  getFocusableElements() {
    const dialog = this.element ? this.element.querySelector('.modal') : null;
    if (!dialog) {
      return [];
    }

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(dialog.querySelectorAll(selector)).filter(
      el => el.getAttribute('tabindex') !== '-1' && !el.closest('[hidden]')
    );
  }

  /**
   * Handle Tab / Shift+Tab while the modal is open, keeping focus inside
   * the dialog and wrapping at either end (WAI-ARIA APG dialog pattern).
   * @param {KeyboardEvent} event - Keydown event
   */
  handleTabKey(event) {
    if (event.key !== 'Tab' || !this.isOpen) {
      return;
    }

    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const currentIndex = focusable.indexOf(document.activeElement);
    let nextIndex;
    if (event.shiftKey) {
      nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
    } else {
      nextIndex =
        currentIndex === -1 || currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
    }

    event.preventDefault();
    focusable[nextIndex].focus();
  }

  /**
   * Add event listener to document and track it
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  addDocumentEventListener(event, handler) {
    if (typeof document !== 'undefined' && handler) {
      document.addEventListener(event, handler);

      // Track for cleanup
      if (!this.documentListeners.has(event)) {
        this.documentListeners.set(event, []);
      }
      this.documentListeners.get(event).push(handler);
    }
  }

  /**
   * Open the modal
   */
  open() {
    // Store reference to currently focused element
    this.previouslyFocused = document.activeElement;
    
    const modal = document.getElementById(this.options.id);
    if (!modal) {
      this.create();
    }

    const openModal = document.getElementById(this.options.id);
    if (openModal) {
      try {
        openModal.setAttribute('aria-hidden', 'false');
      } catch (error) {
        console.warn('Error setting aria-hidden attribute:', error);
      }

      if (document.body) {
        try {
          document.body.classList.add('modal-open');
        } catch (error) {
          console.warn('Error adding modal-open class:', error);
        }
      }

      this.isOpen = true;

      // Track as the topmost open modal for Escape handling
      if (!openModalStack.includes(this)) {
        openModalStack.push(this);
      }

      // Move focus into the dialog (WAI-ARIA APG dialog pattern):
      // focus the first focusable element, or the dialog itself if none exist
      const focusable = this.getFocusableElements();
      if (focusable.length > 0) {
        try {
          focusable[0].focus();
        } catch (error) {
          console.warn('Error setting initial focus:', error);
        }
      } else {
        const dialog = openModal.querySelector('.modal');
        if (dialog) {
          try {
            dialog.setAttribute('tabindex', '0');
            dialog.focus();
          } catch (error) {
            console.warn('Error focusing dialog element:', error);
          }
        }
      }
    }

    return this;
  }

  /**
   * Close the modal
   */
  close() {
    const modal = document.getElementById(this.options.id);
    if (modal) {
      try {
        modal.setAttribute('aria-hidden', 'true');
      } catch (error) {
        console.warn('Error setting aria-hidden attribute:', error);
      }

      if (document.body) {
        try {
          document.body.classList.remove('modal-open');
        } catch (error) {
          console.warn('Error removing modal-open class:', error);
        }
      }

      this.isOpen = false;

      // Remove from the open modal stack
      const stackIndex = openModalStack.indexOf(this);
      if (stackIndex !== -1) {
        openModalStack.splice(stackIndex, 1);
      }

      // Restore focus to previously focused element
      if (this.previouslyFocused && this.previouslyFocused.focus) {
        try {
          this.previouslyFocused.focus();
        } catch (error) {
          console.warn('Error restoring focus:', error);
        }
      }

      if (this.options.onClose && typeof this.options.onClose === 'function') {
        try {
          this.options.onClose();
        } catch (error) {
          console.warn('Error calling onClose callback:', error);
        }
      }
    }

    return this;
  }

  /**
   * Update modal content
   * @param {Object} options - Properties to update
   */
  update(options) {
    // Update options
    Object.assign(this.options, options);

    // If modal exists in DOM, replace it
    const existingModal = document.getElementById(this.options.id);
    if (existingModal) {
      const wasOpen = this.isOpen;

      // Remove old modal
      existingModal.remove();

      // Create new modal with updated options
      this.create();

      // Reopen if it was open
      if (wasOpen) {
        this.open();
      }
    }

    return this;
  }

  /**
   * Remove the modal from the DOM
   */
  destroy() {
    // Remove all document-level event listeners
    this.removeDocumentEventListeners();

    // Remove body class if modal is open with defensive check
    if (this.isOpen && document.body) {
      try {
        document.body.classList.remove('modal-open');
      } catch (error) {
        console.warn('Error removing modal-open class:', error);
      }
    }

    this.isOpen = false;
    this.escapeHandler = null;

    // Remove from the open modal stack
    const stackIndex = openModalStack.indexOf(this);
    if (stackIndex !== -1) {
      openModalStack.splice(stackIndex, 1);
    }

    // Call parent destroy method
    try {
      super.destroy();
    } catch (error) {
      console.warn('Error calling parent destroy:', error);
    }
  }

  /**
   * Remove all document-level event listeners
   */
  removeDocumentEventListeners() {
    if (
      typeof document !== 'undefined' &&
      this.documentListeners &&
      this.documentListeners.size > 0
    ) {
      this.documentListeners.forEach((handlers, event) => {
        if (handlers && Array.isArray(handlers)) {
          handlers.forEach(handler => {
            try {
              document.removeEventListener(event, handler);
            } catch (error) {
              console.warn(`Error removing document ${event} listener:`, error);
            }
          });
        }
      });
      this.documentListeners.clear();
    }
  }

  /**
   * Get all tracked event listeners (for debugging/testing)
   * @returns {Object} Object containing element and document listeners
   */
  getTrackedEventListeners() {
    return {
      element:
        this.eventListeners && this.eventListeners.entries
          ? Array.from(this.eventListeners.entries()).map(([key, handlers]) => ({
            key,
            eventName: key.split('-')[0],
            selector: key.split('-')[1] || 'root',
            count: handlers ? handlers.length : 0,
          }))
          : [],
      document:
        this.documentListeners && this.documentListeners.entries
          ? Array.from(this.documentListeners.entries()).map(([event, handlers]) => ({
            event,
            count: handlers ? handlers.length : 0,
          }))
          : [],
    };
  }
}

// Export for module usage
export default Modal;

// Also make globally available for non-module scripts
if (typeof window !== 'undefined') {
  window.Modal = Modal;
}
