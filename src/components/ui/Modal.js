// Modal Component
// Reusable modal component for consistent UI across the site

class Modal {
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
    this.options = {
      id: options.id || `modal-${Math.random().toString(36).substr(2, 9)}`,
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
    };
    
    this.isOpen = false;
  }

  /**
   * Generate modal HTML
   * @returns {string} - Modal HTML
   */
  generateHTML() {
    const { id, title, content, confirmButtonText, cancelButtonText, showClose, size, showConfirmButton, showCancelButton } = this.options;
    
    // Size class
    const sizeClass = `modal-${size}`;
    
    let html = `
      <div id="${id}" class="modal-overlay" aria-hidden="true">
        <div class="modal ${sizeClass}" role="dialog" aria-labelledby="${id}-title" aria-modal="true">
          <div class="modal-header">
            <h3 id="${id}-title">${title}</h3>
            ${showClose ? '<button class="modal-close" aria-label="Close">&times;</button>' : ''}
          </div>
          <div class="modal-content">
            ${content}
          </div>
    `;
    
    // Only add footer if we have buttons
    if (showConfirmButton || showCancelButton) {
      html += `
        <div class="modal-footer">
      `;
      
      if (showCancelButton) {
        html += `
          <button class="modal-cancel">${cancelButtonText}</button>
        `;
      }
      
      if (showConfirmButton) {
        html += `
          <button class="modal-confirm">${confirmButtonText}</button>
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
      
      // Attach event listeners
      this.attachEventListeners();
    }
    
    return this;
  }

  /**
   * Attach event listeners to the modal
   */
  attachEventListeners() {
    const modal = document.getElementById(this.options.id);
    if (!modal) return;
    
    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    // Confirm button
    const confirmBtn = modal.querySelector('.modal-confirm');
    if (confirmBtn && this.options.onConfirm) {
      confirmBtn.addEventListener('click', () => {
        this.options.onConfirm();
        this.close();
      });
    }
    
    // Cancel button
    const cancelBtn = modal.querySelector('.modal-cancel');
    if (cancelBtn && this.options.onCancel) {
      cancelBtn.addEventListener('click', () => {
        this.options.onCancel();
        this.close();
      });
    }
    
    // Close on click outside (optional)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Open the modal
   */
  open() {
    const modal = document.getElementById(this.options.id);
    if (!modal) {
      this.create();
    }
    
    document.getElementById(this.options.id).setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    this.isOpen = true;
    
    return this;
  }

  /**
   * Close the modal
   */
  close() {
    const modal = document.getElementById(this.options.id);
    if (modal) {
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      this.isOpen = false;
      
      if (this.options.onClose) {
        this.options.onClose();
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
    const modal = document.getElementById(this.options.id);
    if (modal) {
      modal.remove();
    }
    this.isOpen = false;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Modal;
} else {
  window.Modal = Modal;
}
