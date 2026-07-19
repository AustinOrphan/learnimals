# Adding New Subjects to Learnimals

This guide explains how to add new subjects to the Learnimals platform. The system is designed to automatically update the About page with new animal educators when subjects are added.

## Quick Setup

### 1. Add Subject Configuration

Edit `src/config.js` and add your new subject to the `subjects` object:

```javascript
subjects: {
  // ... existing subjects ...

  music: {
    name: 'Music',
    character: {
      name: 'Melody',
      type: 'Bird',
      image: '/public/images/music-bird.png',
      role: 'Music Teacher'
    },
    description: 'Learn music theory and instruments with fun activities'
  }
}
```

### 2. Add Character Image

Place the character image in `/public/images/` following the naming convention:

- `{subject}-{animal}.png` (e.g., `music-bird.png`)

### 3. Create Subject Files

Create the following files for your new subject:

```
src/features/subjects/
├── music/
│   ├── music.css
│   ├── music.js
│   └── music.html (optional - can use template system)
└── shared/
    └── music.html (if using shared template)
```

### 4. Subject Page Options

#### Option A: Use Template System (Recommended)

Create `src/features/subjects/shared/music.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Music - Learnimals</title>
    <script type="module">
      import SubjectTemplateLoader from '/src/utils/subjectTemplateLoader.js';

      const musicOptions = {
        subjectName: 'Music',
        subjectLower: 'music',
        subjectDescription: 'Learn music theory and instruments with fun activities',
        characterName: 'Melody',
        characterType: 'Bird',
        heroSubtitle: 'Make beautiful music with Melody!',

        featureCardsData: [
          {
            title: 'Music Theory Basics',
            content: '<p>Learn notes, scales, and rhythm!</p>',
            linkUrl: '#',
            linkText: 'Start Learning',
          },
          {
            title: 'Virtual Piano',
            content: '<p>Play piano with your keyboard!</p>',
            linkUrl: '#',
            linkText: 'Play Now',
          },
        ],
      };

      document.addEventListener('DOMContentLoaded', async () => {
        await SubjectTemplateLoader.renderTemplate(musicOptions);
      });
    </script>
  </head>
  <body>
    <p>Loading music content...</p>
  </body>
</html>
```

#### Option B: Custom HTML Page

Create a full HTML page in `src/features/subjects/music/music.html` with custom structure.

## Automatic Features

Once you add a subject to `src/config.js`, the following happens automatically:

### ✅ About Page Updates

- The "Meet Our Animal Educators" section automatically includes your new character
- Character name, image, and role are pulled from the config
- No manual HTML editing required

### ✅ Centralized Management

- All subject data is managed in one location (`src/config.js`)
- Easy to update character details, descriptions, or add new subjects
- Consistent naming and structure across the application

### ✅ Theme Integration

- New subjects automatically inherit the theme system
- Character images and content adapt to light/dark modes
- Consistent styling with existing subjects

## Advanced Configuration

### Adding Subject-Specific Features

You can extend the subject configuration with additional properties:

```javascript
music: {
  name: 'Music',
  character: {
    name: 'Melody',
    type: 'Bird',
    image: '/public/images/music-bird.png',
    role: 'Music Teacher'
  },
  description: 'Learn music theory and instruments with fun activities',

  // Advanced options
  color: '#9b59b6',          // Subject-specific color
  difficulty: 'beginner',     // Difficulty level
  ageRange: '4-10',          // Target age range
  features: ['theory', 'instruments', 'composition'], // Available features
  games: ['piano', 'rhythm-match', 'note-names']     // Associated games
}
```

### Custom Utilities

The subject system provides utility functions in `src/utils/subjectEducators.js`:

```javascript
import { getSubjects, getSubject } from '../utils/subjectEducators.js';

// Get all subjects
const allSubjects = getSubjects();

// Get specific subject
const musicSubject = getSubject('music');

// Generate educator HTML for custom components
import { generateEducatorsHTML } from '../utils/subjectEducators.js';
const educatorHTML = generateEducatorsHTML();
```

## File Structure Example

After adding a music subject:

```
src/
├── config.js                           # ← Subject added here
├── features/subjects/
│   ├── music/                          # ← New subject folder
│   │   ├── music.css
│   │   ├── music.js
│   │   └── music.html (optional)
│   └── shared/
│       └── music.html                  # ← Subject page using template
├── utils/
│   └── subjectEducators.js             # ← Utility functions (no changes needed)
└── pages/
    └── about.html                      # ← Automatically updated!

public/images/
└── music-bird.png                      # ← Character image
```

## Benefits

1. **Scalable**: Easy to add unlimited subjects
2. **Maintainable**: Central configuration prevents duplication
3. **Automatic**: About page updates without manual editing
4. **Consistent**: All subjects follow the same pattern
5. **Flexible**: Support for both template and custom pages

## Next Steps

After adding your subject:

1. Test the About page to see your new educator
2. Create engaging content for your subject page
3. Add games or interactive features specific to your subject
4. Update navigation menus if needed
5. Add your subject to any subject listing components

The dynamic system ensures your new subject is properly integrated across the entire Learnimals platform!
