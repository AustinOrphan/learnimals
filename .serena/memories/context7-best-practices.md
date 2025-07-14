# Context7 Best Practices for Game Architecture

## Key Principles from Clean Code JavaScript

### Class Design and Inheritance
1. **Use ES6 Classes**: Modern `class`, `extends`, and `super` syntax over prototype-based inheritance
2. **Single Responsibility Principle (SRP)**: Each class should have one reason to change
3. **Open/Closed Principle (OCP)**: Classes open for extension, closed for modification
4. **Liskov Substitution Principle (LSP)**: Derived classes must be substitutable for base classes
5. **Composition over Inheritance**: Prefer "has-a" relationships over "is-a" when appropriate

### Method Design
1. **Method Chaining**: Return `this` from setters to enable fluent interfaces
2. **Single Level of Abstraction**: Each method should operate at one level of abstraction
3. **Descriptive Names**: Function names should clearly indicate their purpose
4. **Minimal Parameters**: Use object destructuring for complex parameter sets

### Error Handling & Cleanup
1. **Proper Resource Cleanup**: Always clean up event listeners, timers, and other resources
2. **Comprehensive Error Handling**: Use try/catch with meaningful error responses
3. **Graceful Degradation**: Handle missing APIs or features gracefully

### Code Organization
1. **Caller/Callee Proximity**: Place functions calling others vertically close
2. **Consistent Naming**: Use consistent vocabulary throughout the codebase
3. **Remove Dead Code**: Don't keep unused code "just in case"
4. **Avoid Mental Mapping**: Use descriptive variable names

### Game-Specific Applications

#### BaseGame Class Extension
- Use clear inheritance hierarchy with `extends`
- Implement lifecycle methods (onStart, onPause, onEnd, etc.)
- Provide template methods that can be overridden by subclasses
- Use dependency injection for configuration and dependencies

#### Event System
- Use composition for event management
- Implement clear observer pattern with on/off/emit methods
- Encapsulate event logic in dedicated classes

#### Resource Management
- Implement proper cleanup in `destroy()` methods
- Use closures for private state when needed
- Avoid global state pollution

## Best Practices for Migration

1. **Gradual Migration**: Convert one game at a time
2. **Interface Consistency**: Maintain common interface across all games
3. **Progressive Enhancement**: Add features incrementally
4. **Test Coverage**: Ensure each migrated game maintains functionality