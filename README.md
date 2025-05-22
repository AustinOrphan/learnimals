# Learnimals - Educational Games for Kids

Learnimals is an interactive educational platform featuring fun animal characters who guide children through math, science, reading, and art activities.

## Project Overview

This website provides a collection of educational games and activities designed to make learning engaging and fun. Each subject area is represented by an animal character:

- **Math with Mango** (shark) - Numbers, puzzles, and math games
- **Science with Sky** (parrot) - Experiments and interesting facts
- **Reading with Ruby** (panda) - Stories and reading comprehension
- **Art with Leo** (lion) - Creative activities and art projects

## Project Structure

```
learnimals-site/
├── index.html               # Main landing page
├── about.html               # About page
├── contact.html             # Contact page
├── profile.html             # User profile page
├── manifest.json            # PWA manifest
├── serviceWorker.js         # Service worker for offline capabilities
├── assets/                  # Static assets
│   └── images/              # Images and icons
├── components/              # Reusable HTML components
│   └── navbar.html          # Navbar component
├── css/                     # Stylesheets
│   ├── styles.css           # Global styles
│   ├── navbar.css           # Navigation styles
│   ├── math.css             # Math section styles
│   ├── bubblepop.css        # Bubble Pop game styles
│   └── subjects/            # Subject-specific styles
├── js/                      # JavaScript files
│   ├── config.js            # Global configuration
│   ├── main.js              # Main script
│   ├── bubblepop.js         # Bubble Pop game logic
│   ├── math.js              # Math section scripts
│   ├── science.js           # Science section scripts
│   ├── art.js               # Art section scripts
│   ├── themeInitializer.js  # Theme initialization
│   ├── components/          # UI components
│   ├── games/               # Game modules
│   ├── user/                # User-related functionality
│   └── utils/               # Utility functions
└── subjects/                # Subject pages
    ├── math.html            # Math section
    ├── science.html         # Science section
    ├── reading.html         # Reading section
    ├── art.html             # Art section
    └── bubblepop.html       # Bubble Pop game page
```

## Key Features

- **Responsive Design**: Mobile-friendly interface that works across devices
- **Interactive Games**: Educational games like Bubble Pop (math) and Word Scramble (reading)
- **Theme Switching**: Light/dark mode for comfortable viewing
- **PWA Support**: Works offline with service worker caching
- **Modular Architecture**: Component-based code organization for maintainability

## Code Organization

### Modular JavaScript Architecture

The JavaScript code follows a modular pattern with ES6 modules:

- **Main App**: Entry point scripts for each section
- **Components**: Reusable UI elements (navbar, theme switcher)
- **Games**: Self-contained game modules
- **Utils**: Shared utility functions
- **Config**: Centralized configuration

### CSS Organization

- Global styles in `styles.css`
- Component-specific styles in dedicated files
- Subject-specific styles in the `subjects/` directory
- BEM naming convention used for class names

## Games

### Bubble Pop

A math game where players pop bubbles containing the correct answers to simple math problems. Features include:

- Animated bubbles with physics-based movement
- Score tracking
- Mobile touch support
- Performance optimizations (canvas rendering)

## Development

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, etc.)
- Local web server for testing

### Running Locally

1. Clone this repository
2. Start a local web server in the project root
3. Open `index.html` in your browser

## Future Improvements

- User accounts and progress tracking
- More games and educational content
- Accessibility improvements
- Internationalization