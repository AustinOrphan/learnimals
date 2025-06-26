/**
 * @fileoverview Modal Component - Reusable modal dialog component for consistent UI across the site
 * @module Modal
 * @requires BaseComponent
 * @version 1.0.0
 * @author Learnimals Development Team
 * @since 1.0.0
 */

import BaseComponent from '../BaseComponent.js';

/**
 * Modal component for creating accessible dialog boxes with customizable content.
 * Supports various sizes, button configurations, and callback functions.
 * Automatically handles accessibility features like ARIA attributes and keyboard navigation.
 * 
 * @class Modal
 * @extends BaseComponent
 * @example
 * // Basic modal usage
 * const modal = new Modal({
 *   id: 'confirmation-modal',
 *   title: 'Confirm Action',
 *   content: '<p>Are you sure you want to continue?</p>',
 *   confirmButtonText: 'Yes',
 *   cancelButtonText: 'No',
 *   onConfirm: () => console.log('Confirmed'),
 *   onCancel: () => console.log('Cancelled')
 * });
 * modal.open();
 * 
 * @example
 * // Simple notification modal
 * const notification = new Modal({
 *   id: 'notification',
 *   title: 'Success!',
 *   content: '<p>Your changes have been saved.</p>',
 *   showCancelButton: false,
 *   onConfirm: () => notification.close()
 * });
 * notification.open();
 */
class Modal extends BaseComponent {
  /**
   * Creates a new Modal instance with the specified configuration.
   * The modal is not automatically shown upon creation - call open() to display it.
   * 
   * @param {Object} options - Configuration options for the modal
   * @param {string} options.id - Unique identifier for the modal element (must be unique in DOM)
   * @param {string} options.title - Title text displayed in the modal header
   * @param {string} options.content - HTML content for the modal body (supports any valid HTML)
   * @param {string} [options.confirmButtonText='OK'] - Text for the confirm/primary button
   * @param {string} [options.cancelButtonText='Cancel'] - Text for the cancel/secondary button
   * @param {Function} [options.onConfirm] - Callback function executed when confirm button is clicked
   * @param {Function} [options.onCancel] - Callback function executed when cancel button is clicked
   * @param {Function} [options.onClose] - Callback function executed when modal is closed by any method
   * @param {boolean} [options.showClose=true] - Whether to display the X close button in header
   * @param {boolean} [options.showConfirmButton=true] - Whether to display the confirm button
   * @param {boolean} [options.showCancelButton=false] - Whether to display the cancel button
   * @param {('small'|'medium'|'large')} [options.size='medium'] - Size variant of the modal
   * 
   * @throws {Error} Throws error if required options.id is not provided
   * @throws {Error} Throws error if options.id already exists in DOM
   * 
   * @example
   * const confirmModal = new Modal({
   *   id: 'delete-confirmation',
   *   title: 'Delete Item',
   *   content: '<p>This action cannot be undone. Continue?</p>',
   *   size: 'small',
   *   showCancelButton: true,
   *   onConfirm: () => deleteItem(),
   *   onCancel: () => console.log('Deletion cancelled')
   * });
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
      ...options
    });

    this.isOpen = false;
  }

  /**
   * Generates the complete HTML structure for the modal.
   * Creates a fully accessible modal with proper ARIA attributes,
   * responsive design classes, and configured buttons.
   * 
   * @returns {string} Complete HTML string for the modal element
   * 
   * @example
   * const modal = new Modal({id: 'test', title: 'Test', content: 'Hello'});
   * const html = modal.generateHTML();
   * // Returns: '<div id="test" class="component modal-overlay" aria-hidden="true">...'
   * 
   * @private
   */
  generateHTML() {
    const { id, title, content, confirmButtonText, cancelButtonText, showClose, size, showConfirmButton, showCancelButton } = this.options;

    // Size class
    const sizeClass = `modal--${size}`;

    let html = `
      <div id="${id}" class="component modal-overlay" aria-hidden="true">
        <div class="modal ${sizeClass}" role="dialog" aria-labelledby="${id}-title" aria-modal="true">
          <div class="modal-header">
            <h3 id="${id}-title" class="modal-title">${title}</h3>
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
          <button class="modal-cancel component-button component-button--outline">${cancelButtonText}</button>
        `;
      }

      if (showConfirmButton) {
        html += `
          <button class="modal-confirm component-button component-button--primary">${confirmButtonText}</button>
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
   * Creates the modal in the DOM but doesn't display it.
   * This method handles DOM element creation, event listener attachment,
   * and ensures the modal is ready for display when open() is called.
   * 
   * @returns {Modal} Returns this instance for method chaining
   * 
   * @example
   * const modal = new Modal({id: 'test', title: 'Test', content: 'Hello'});
   * modal.create(); // Modal exists in DOM but is hidden
   * modal.open();   // Now modal becomes visible
   * 
   * @private
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
   * Attaches all necessary event listeners to the modal.
   * Sets up handlers for close button, confirm/cancel buttons, outside clicks,
   * and keyboard navigation (Escape key). Also manages global event handlers.
   * 
   * @example
   * // Event listeners are automatically attached during create()
   * modal.create(); // attachEventListeners() called internally
   * 
   * @private
   */
  attachEventListeners() {
    // Close button
    this.addEventListener('click', () => this.close(), '.modal-close');

    // Confirm button
    if (this.options.onConfirm) {
      this.addEventListener('click', () => {
        this.options.onConfirm();
        this.close();
      }, '.modal-confirm');
    }

    // Cancel button
    if (this.options.onCancel) {
      this.addEventListener('click', () => {
        this.options.onCancel();
        this.close();
      }, '.modal-cancel');
    }

    // Close on click outside
    this.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });

    // Close on Escape key - handled globally
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  /**
   * Opens and displays the modal to the user.
   * Creates the modal if it doesn't exist, makes it visible,
   * and applies necessary body classes for proper styling.
   * 
   * @returns {Modal} Returns this instance for method chaining
   * 
   * @example
   * const modal = new Modal({id: 'test', title: 'Test', content: 'Hello'});
   * modal.open(); // Modal becomes visible
   * 
   * @example
   * // Method chaining
   * modal.open().close(); // Open then immediately close
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
   * Closes and hides the modal from the user.
   * Removes body classes, triggers onClose callback if provided,
   * and restores the page to its pre-modal state.
   * 
   * @returns {Modal} Returns this instance for method chaining
   * 
   * @example
   * modal.close(); // Modal becomes hidden
   * 
   * @example
   * // Close with callback
   * const modal = new Modal({
   *   id: 'test',
   *   title: 'Test',
   *   content: 'Hello',
   *   onClose: () => console.log('Modal closed!')
   * });
   * modal.close(); // Logs 'Modal closed!' when closed
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
   * Updates the modal's content and configuration dynamically.
   * Merges new options with existing ones and recreates the modal
   * if it exists in the DOM. Preserves the open/closed state.
   * 
   * @param {Object} options - Properties to update (same format as constructor options)
   * @param {string} [options.title] - New title for the modal
   * @param {string} [options.content] - New HTML content for the modal body
   * @param {string} [options.confirmButtonText] - New text for confirm button
   * @param {string} [options.cancelButtonText] - New text for cancel button
   * @param {Function} [options.onConfirm] - New confirm callback function
   * @param {Function} [options.onCancel] - New cancel callback function
   * @param {boolean} [options.showClose] - Whether to show close button
   * @param {('small'|'medium'|'large')} [options.size] - New size variant
   * 
   * @returns {Modal} Returns this instance for method chaining
   * 
   * @example
   * modal.update({
   *   title: 'Updated Title',
   *   content: '<p>New content here!</p>',
   *   confirmButtonText: 'Save Changes'
   * });
   * 
   * @example
   * // Update callbacks
   * modal.update({
   *   onConfirm: () => saveData(),
   *   onCancel: () => discardChanges()
   * });
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
   * Completely removes the modal from the DOM and cleans up all resources.
   * Removes event listeners, clears body classes, and calls parent destroy method.
   * After calling destroy(), the modal instance should not be used again.
   * 
   * @example
   * modal.destroy(); // Modal completely removed from DOM
   * // modal is now unusable and should be discarded
   * 
   * @example
   * // Cleanup before page navigation
   * window.addEventListener('beforeunload', () => {
   *   modal.destroy();
   * });
   */
  destroy() {
    // Remove escape key handler
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }

    // Remove body class if modal is open
    if (this.isOpen) {
      document.body.classList.remove('modal-open');
    }

    this.isOpen = false;

    // Call parent destroy method
    super.destroy();
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Modal;
} else {
  window.Modal = Modal;
}
