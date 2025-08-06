/**
 * CardV2 - Backward compatibility wrapper (FR-4.1)
 * Maintains existing import paths while redirecting to new co-located CSS structure
 * This file redirects to the restructured Card component with co-located CSS
 */

// Import the new restructured Card component with co-located CSS
import Card from './Card/Card.js';

// Export the new Card component as default for backward compatibility
export default Card;

// Also make available globally for backward compatibility (FR-4.1)
if (typeof window !== 'undefined') {
  window.CardV2 = Card;
}