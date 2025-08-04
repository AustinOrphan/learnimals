// Modal Component
// Reusable modal component for consistent UI across the site

// Use global BaseComponent (loaded via script tag in demo page)
const BaseComponent = window.BaseComponent;

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

    // Close on Escape key - handled globally
    this.escapeHandler = e => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };

    // Track document-level event listener
    this.addDocumentEventListener('keydown', this.escapeHandler);
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
