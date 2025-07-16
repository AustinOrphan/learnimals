// PlaceValueManipulative Component
// Interactive place value learning tool with visual blocks

class PlaceValueManipulative {
  /**
   * Create a place value manipulative
   * @param {Object} options - Component options
   * @param {string} options.containerId - Container element ID
   * @param {number} [options.maxNumber=9999] - Maximum number to work with
   * @param {string} [options.mode='compose'] - Mode: 'compose' or 'decompose'
   */
  constructor(options) {
    this.options = {
      containerId: options.containerId,
      maxNumber: options.maxNumber || 9999,
      mode: options.mode || 'compose',
      ...options
    };
    
    this.currentNumber = 0;
    this.blocks = {
      thousands: 0,
      hundreds: 0,
      tens: 0,
      ones: 0
    };
    
    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      console.error('PlaceValueManipulative: Container not found:', this.options.containerId);
      return;
    }
    
    this.render();
    this.attachEventListeners();
  }

  /**
   * Render the component
   */
  render() {
    this.container.innerHTML = this.generateHTML();
  }

  /**
   * Generate component HTML
   * @returns {string} - Component HTML
   */
  generateHTML() {
    return `
      <div class="place-value-manipulative">
        <div class="pv-header">
          <h3>Place Value Builder</h3>
          <div class="pv-mode-toggle">
            <button class="mode-btn ${this.options.mode === 'compose' ? 'active' : ''}" data-mode="compose">
              Build Numbers
            </button>
            <button class="mode-btn ${this.options.mode === 'decompose' ? 'active' : ''}" data-mode="decompose">
              Break Down Numbers
            </button>
          </div>
        </div>

        <div class="pv-workspace">
          ${this.options.mode === 'compose' ? this.generateComposeMode() : this.generateDecomposeMode()}
        </div>

        <div class="pv-blocks-area">
          <h4>Available Blocks</h4>
          <div class="blocks-container">
            ${this.generateBlockTypes()}
          </div>
        </div>

        <div class="pv-result">
          <div class="number-display">
            <span class="number-value">${this.formatNumber(this.currentNumber)}</span>
            <span class="number-words">${this.numberToWords(this.currentNumber)}</span>
          </div>
          <button class="reset-btn">Reset</button>
        </div>
      </div>
    `;
  }

  /**
   * Generate compose mode interface
   * @returns {string} - Compose mode HTML
   */
  generateComposeMode() {
    return `
      <div class="compose-area">
        <h4>Drag blocks here to build a number:</h4>
        <div class="place-value-chart">
          <div class="place-column" data-place="thousands">
            <div class="place-label">Thousands</div>
            <div class="place-dropzone" data-place="thousands">
              ${this.generatePlacedBlocks('thousands')}
            </div>
            <div class="place-count">${this.blocks.thousands}</div>
          </div>
          <div class="place-column" data-place="hundreds">
            <div class="place-label">Hundreds</div>
            <div class="place-dropzone" data-place="hundreds">
              ${this.generatePlacedBlocks('hundreds')}
            </div>
            <div class="place-count">${this.blocks.hundreds}</div>
          </div>
          <div class="place-column" data-place="tens">
            <div class="place-label">Tens</div>
            <div class="place-dropzone" data-place="tens">
              ${this.generatePlacedBlocks('tens')}
            </div>
            <div class="place-count">${this.blocks.tens}</div>
          </div>
          <div class="place-column" data-place="ones">
            <div class="place-label">Ones</div>
            <div class="place-dropzone" data-place="ones">
              ${this.generatePlacedBlocks('ones')}
            </div>
            <div class="place-count">${this.blocks.ones}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate decompose mode interface
   * @returns {string} - Decompose mode HTML
   */
  generateDecomposeMode() {
    return `
      <div class="decompose-area">
        <div class="number-input-section">
          <label for="target-number">Enter a number to break down:</label>
          <input type="number" id="target-number" min="1" max="${this.options.maxNumber}" placeholder="Enter number...">
          <button class="decompose-btn">Break Down</button>
        </div>
        <div class="decompose-result">
          <div class="place-value-breakdown">
            ${this.generateBreakdownDisplay()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate block types for manipulation
   * @returns {string} - Block types HTML
   */
  generateBlockTypes() {
    const blockTypes = [
      { type: 'thousands', value: 1000, color: 'purple', label: '1000' },
      { type: 'hundreds', value: 100, color: 'blue', label: '100' },
      { type: 'tens', value: 10, color: 'green', label: '10' },
      { type: 'ones', value: 1, color: 'orange', label: '1' }
    ];

    return blockTypes.map(block => `
      <div class="block-type">
        <div class="block-visual block-${block.color}" data-value="${block.value}" data-type="${block.type}" draggable="true">
          ${block.label}
        </div>
        <button class="add-block-btn" data-type="${block.type}" data-value="${block.value}">
          Add ${block.type}
        </button>
      </div>
    `).join('');
  }

  /**
   * Generate placed blocks for a place value
   * @param {string} place - Place value (ones, tens, hundreds, thousands)
   * @returns {string} - Placed blocks HTML
   */
  generatePlacedBlocks(place) {
    const count = this.blocks[place];
    const blocks = [];
    
    for (let i = 0; i < count; i++) {
      blocks.push(`<div class="placed-block block-${this.getBlockColor(place)}" data-place="${place}"></div>`);
    }
    
    return blocks.join('');
  }

  /**
   * Generate breakdown display for decompose mode
   * @returns {string} - Breakdown display HTML
   */
  generateBreakdownDisplay() {
    if (this.currentNumber === 0) {
      return '<p class="breakdown-placeholder">Enter a number above to see its breakdown</p>';
    }

    const breakdown = this.decomposeNumber(this.currentNumber);
    return `
      <div class="breakdown-visual">
        ${Object.entries(breakdown).map(([place, count]) => {
    if (count === 0) return '';
    return `
            <div class="breakdown-section">
              <div class="breakdown-label">${place}: ${count}</div>
              <div class="breakdown-blocks">
                ${Array(count).fill().map(() => 
    `<div class="breakdown-block block-${this.getBlockColor(place)}"></div>`
  ).join('')}
              </div>
              <div class="breakdown-value">${count} × ${this.getPlaceValue(place)} = ${count * this.getPlaceValue(place)}</div>
            </div>
          `;
  }).join('')}
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Mode toggle buttons
    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.options.mode = e.target.dataset.mode;
        this.render();
        this.attachEventListeners();
      });
    });

    // Add block buttons
    this.container.querySelectorAll('.add-block-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const _type = e.target.dataset.type;
        this.addBlock(type);
      });
    });

    // Reset button
    const resetBtn = this.container.querySelector('.reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }

    // Decompose button
    const decomposeBtn = this.container.querySelector('.decompose-btn');
    if (decomposeBtn) {
      decomposeBtn.addEventListener('click', () => this.decomposeInput());
    }

    // Drag and drop (if compose mode)
    if (this.options.mode === 'compose') {
      this.setupDragAndDrop();
    }
  }

  /**
   * Setup drag and drop functionality
   */
  setupDragAndDrop() {
    // Make blocks draggable
    this.container.querySelectorAll('.block-visual[draggable="true"]').forEach(block => {
      block.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
          type: e.target.dataset.type,
          value: e.target.dataset.value
        }));
      });
    });

    // Setup drop zones
    this.container.querySelectorAll('.place-dropzone').forEach(dropzone => {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          const targetPlace = dropzone.dataset.place;
          
          if (data.type === targetPlace) {
            this.addBlock(data.type);
          }
        } catch (error) {
          console.warn('Invalid drag data:', error);
        }
      });
    });
  }

  /**
   * Add a block to the workspace
   * @param {string} type - Block type (ones, tens, hundreds, thousands)
   */
  addBlock(type) {
    if (!Object.prototype.hasOwnProperty.call(this.blocks, type)) return;
    
    const value = this.getPlaceValue(type);
    
    // Check if adding this block would exceed max number
    if (this.currentNumber + value > this.options.maxNumber) {
      this.showMessage(`Cannot exceed ${this.options.maxNumber}!`, 'warning');
      return;
    }
    
    this.blocks[type]++;
    this.currentNumber += value;
    this.updateDisplay();
  }

  /**
   * Remove a block from the workspace
   * @param {string} type - Block type
   */
  removeBlock(type) {
    if (!Object.prototype.hasOwnProperty.call(this.blocks, type) || this.blocks[type] <= 0) return;
    
    const value = this.getPlaceValue(type);
    this.blocks[type]--;
    this.currentNumber -= value;
    this.updateDisplay();
  }

  /**
   * Reset the manipulative
   */
  reset() {
    this.blocks = { thousands: 0, hundreds: 0, tens: 0, ones: 0 };
    this.currentNumber = 0;
    this.updateDisplay();
  }

  /**
   * Update the display
   */
  updateDisplay() {
    if (this.options.mode === 'compose') {
      // Update place value chart
      Object.keys(this.blocks).forEach(place => {
        const dropzone = this.container.querySelector(`.place-dropzone[data-place="${place}"]`);
        const countDisplay = this.container.querySelector(`.place-column[data-place="${place}"] .place-count`);
        
        if (dropzone) {
          dropzone.innerHTML = this.generatePlacedBlocks(place);
        }
        if (countDisplay) {
          countDisplay.textContent = this.blocks[place];
        }
      });
    }
    
    // Update number display
    const numberValue = this.container.querySelector('.number-value');
    const numberWords = this.container.querySelector('.number-words');
    
    if (numberValue) numberValue.textContent = this.formatNumber(this.currentNumber);
    if (numberWords) numberWords.textContent = this.numberToWords(this.currentNumber);
  }

  /**
   * Handle decompose input
   */
  decomposeInput() {
    const input = this.container.querySelector('#target-number');
    if (!input) return;
    
    const number = parseInt(input.value);
    if (isNaN(number) || number < 1 || number > this.options.maxNumber) {
      this.showMessage(`Please enter a number between 1 and ${this.options.maxNumber}`, 'error');
      return;
    }
    
    this.currentNumber = number;
    this.blocks = this.decomposeNumber(number);
    
    // Update decompose display
    const breakdownSection = this.container.querySelector('.decompose-result');
    if (breakdownSection) {
      breakdownSection.innerHTML = `<div class="place-value-breakdown">${this.generateBreakdownDisplay()}</div>`;
    }
    
    this.updateDisplay();
  }

  /**
   * Decompose a number into place values
   * @param {number} number - Number to decompose
   * @returns {Object} - Place value breakdown
   */
  decomposeNumber(number) {
    return {
      thousands: Math.floor(number / 1000),
      hundreds: Math.floor((number % 1000) / 100),
      tens: Math.floor((number % 100) / 10),
      ones: number % 10
    };
  }

  /**
   * Get place value for a place type
   * @param {string} place - Place type
   * @returns {number} - Place value
   */
  getPlaceValue(place) {
    const values = { ones: 1, tens: 10, hundreds: 100, thousands: 1000 };
    return values[place] || 0;
  }

  /**
   * Get block color for a place type
   * @param {string} place - Place type
   * @returns {string} - Color name
   */
  getBlockColor(place) {
    const colors = { 
      ones: 'orange', 
      tens: 'green', 
      hundreds: 'blue', 
      thousands: 'purple' 
    };
    return colors[place] || 'gray';
  }

  /**
   * Format number with commas
   * @param {number} number - Number to format
   * @returns {string} - Formatted number
   */
  formatNumber(number) {
    return number.toLocaleString();
  }

  /**
   * Convert number to words (simplified version)
   * @param {number} number - Number to convert
   * @returns {string} - Number in words
   */
  numberToWords(number) {
    if (number === 0) return 'zero';
    if (number === 1) return 'one';
    if (number <= 20) {
      const words = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 
        'seventeen', 'eighteen', 'nineteen', 'twenty'];
      return words[number] || '';
    }
    
    // For numbers > 20, use existing convertNumber logic or simplified version
    return `${number} (${Math.floor(number/1000)}k ${Math.floor((number%1000)/100)}h ${Math.floor((number%100)/10)}t ${number%10}o)`;
  }

  /**
   * Show a message to the user
   * @param {string} message - Message text
   * @param {string} type - Message type (info, warning, error)
   */
  showMessage(message, _type = 'info') {
    // Simple message display - could be enhanced with a toast system
    const messageEl = document.createElement('div');
    messageEl.className = `pv-message pv-message-${type}`;
    messageEl.textContent = message;
    
    this.container.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaceValueManipulative;
} else {
  window.PlaceValueManipulative = PlaceValueManipulative;
}