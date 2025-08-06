// Test if BaseComponent can be loaded
try {
  // Simulate browser environment
  global.window = global;
  
  // Load BaseComponent.js
  require('./src/components/BaseComponent.js');
  
  if (global.BaseComponent) {
    console.log('✅ BaseComponent is now available globally');
    
    // Test creating a simple instance
    const base = new global.BaseComponent({ id: 'test' });
    console.log('✅ BaseComponent can be instantiated');
    console.log('BaseComponent methods:', Object.getOwnPropertyNames(global.BaseComponent.prototype).filter(name => name !== 'constructor'));
  } else {
    console.log('❌ BaseComponent is not available globally');
  }
} catch (e) {
  console.log('❌ Error loading BaseComponent:', e.message);
  console.log('Stack trace:', e.stack);
}