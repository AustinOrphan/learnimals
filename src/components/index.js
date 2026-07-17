// Component Library Index
// Central export file for all Learnimals components

// Base Component
import BaseComponent from './BaseComponent.js';

// UI Components
import Card from './ui/Card.js';
import Modal from './ui/Modal.js';

// Form Components
import FormComponent from './forms/FormComponent.js';

// Layout Components
// NOTE: layout/navigation.js and ui/PlaceValueManipulative.js are classic
// scripts loaded via <script> tags in pages (they attach to window) — they
// have no ES exports and must not be imported here.
import ThemeSwitcher from './layout/themeSwitcher.js';

// Export all components
export { BaseComponent, Card, Modal, FormComponent, ThemeSwitcher };

// Also make them available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.Learnimals = window.Learnimals || {};
  window.Learnimals.Components = { BaseComponent, Card, Modal, FormComponent, ThemeSwitcher };
}

// Default export for convenience
export default { BaseComponent, Card, Modal, FormComponent, ThemeSwitcher };
