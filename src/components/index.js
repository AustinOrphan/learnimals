// Component Library Index
// Central export file for all Learnimals components

// Base Component
import BaseComponent from './BaseComponent.js';

// UI Components
import Card from './ui/Card.js';
import Modal from './ui/Modal.js';
import PlaceValueManipulative from './ui/PlaceValueManipulative.js';

// Form Components
import FormComponent from './forms/FormComponent.js';

// Layout Components
import NavigationComponent from './layout/navigation.js';
import ThemeSwitcher from './layout/themeSwitcher.js';

// Export all components
export {
  BaseComponent,
  Card,
  Modal,
  PlaceValueManipulative,
  FormComponent,
  NavigationComponent,
  ThemeSwitcher,
};

// Also make them available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.Learnimals = window.Learnimals || {};
  window.Learnimals.Components = {
    BaseComponent,
    Card,
    Modal,
    PlaceValueManipulative,
    FormComponent,
    NavigationComponent,
    ThemeSwitcher,
  };
}

// Default export for convenience
export default {
  BaseComponent,
  Card,
  Modal,
  PlaceValueManipulative,
  FormComponent,
  NavigationComponent,
  ThemeSwitcher,
};
