# Subject Template System for Learnimals

This documentation explains how to use the subject template system to maintain consistent design and structure across all subject pages (math, science, reading, art, coding) while allowing for subject-specific content.

## How the Template System Works

1. The template is stored in `/templates/subject.html` and contains placeholders like `{{subjectName}}` that are replaced with subject-specific content.
2. The template loader utility (`/js/utils/subjectTemplateLoader.js`) handles fetching the template and replacing placeholders with actual content.
3. Each subject page imports the template loader and provides its own specific content.

## Using the Template for a Subject Page

1. Create a new HTML file for your subject (e.g., `subjects/coding.html`)
2. Follow the structure shown in the example files:
   - Import the SubjectTemplateLoader
   - Define options object with subject-specific content
   - Call the renderTemplate method when the DOM is loaded

### Template Options

| Option | Description | Example |
|--------|-------------|---------|
| `subjectName` | Name of the subject | "Math Tools", "Science" |
| `subjectLower` | Lowercase version for file paths | "math", "science" |
| `subjectDescription` | Meta description for SEO | "Fun math tools and games..." |
| `characterName` | Name of the animal character | "Mango", "Sky" |
| `characterType` | Type of animal | "Shark", "Parrot" |
| `heroSubtitle` | Subtitle for the hero section | "Try out fun math helpers below." |
| `featureCards` | HTML content for feature cards (fallback) | `<div class="feature-card">...</div>` |
| `featureCardsData` | Array of card data for Card.js component | `[{title: "Math Tools", content: "..."}]` |

## Example Implementation

### Using Traditional HTML for Feature Cards (Fallback Method)

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Math - Learnimals</title>
        <script type="module">
            import SubjectTemplateLoader from '/learnimals-site/js/utils/subjectTemplateLoader.js';

            // Define content for math page
            const mathOptions = {
                subjectName: 'Math Tools',
                subjectLower: 'math',
                subjectDescription: 'Fun math tools and games for children featuring Mango the Shark',
                characterName: 'Mango',
                characterType: 'Shark',
                heroSubtitle: 'Try out fun math helpers below.',
                featureCards: `
                    <div class="feature-card">
                        <h3>Number to Words</h3>
                        <p>Enter a number and get the name!</p>
                        <!-- More content here -->
                    </div>
                    <!-- More feature cards -->
                `
            };

            // Render the template with math-specific content
            document.addEventListener('DOMContentLoaded', async () => {
                await SubjectTemplateLoader.renderTemplate(mathOptions);
            });
        </script>
    </head>
    <body>
        <!-- This content will be replaced by the template -->
        <p>Loading math content...</p>
    </body>
</html>
```

### Using Card.js Component (Recommended Method)

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Math - Learnimals</title>
        <script type="module">
            import SubjectTemplateLoader from '/learnimals-site/js/utils/subjectTemplateLoader.js';

            // Define content for math page
            const mathOptions = {
                subjectName: 'Math Tools',
                subjectLower: 'math',
                subjectDescription: 'Fun math tools and games for children featuring Mango the Shark',
                characterName: 'Mango',
                characterType: 'Shark',
                heroSubtitle: 'Try out fun math helpers below.',
                // Fallback HTML if Card.js doesn't work
                featureCards: `
                    <div class="feature-card">
                        <h3>Number to Words</h3>
                        <p>Enter a number and get the name!</p>
                        <!-- More content here -->
                    </div>
                    <!-- More feature cards -->
                `,
                // Card.js data for generating cards (preferred approach)
                featureCardsData: [
                    {
                        title: 'Number to Words',
                        content: '<p>Enter a number and get the name!</p>',
                        imageUrl: '/learnimals-site/assets/images/math-shark.png',
                        imageAlt: 'Mango the Math Shark'
                    },
                    {
                        isLinked: true,
                        title: 'Mango\'s Bubble Pop',
                        content: '<p>Pop bubbles with the right math answer!</p>',
                        linkText: 'Play Now',
                        linkUrl: 'bubblepop.html',
                        theme: 'alt'
                    }
                ]
            };

            // Render the template with math-specific content
            document.addEventListener('DOMContentLoaded', async () => {
                await SubjectTemplateLoader.renderTemplate(mathOptions);
            });
        </script>
    </head>
    <body>
        <!-- This content will be replaced by the template -->
        <p>Loading math content...</p>
    </body>
</html>
```

## File Structure

- `/templates/subject.html`: The HTML template with placeholders
- `/js/utils/subjectTemplateLoader.js`: JavaScript utility to load and process the template
- `/examples/math-example.html`: Example implementation for math subject
- `/examples/science-example.html`: Example implementation for science subject

## Card.js Configuration Options

When using the Card.js component for feature cards, you can provide the following options in each card object:

| Option | Description | Type | Example |
|--------|-------------|------|---------|
| `title` | Card title | string | "Number to Words" |
| `content` | Card content (can include HTML) | string | "<p>Enter a number...</p>" |
| `imageUrl` | URL to the card image | string | "/assets/images/math-shark.png" |
| `imageAlt` | Alt text for the image | string | "Mango the Shark" |
| `linkUrl` | URL for linked cards | string | "bubblepop.html" |
| `linkText` | Text for the link button | string | "Play Now" |
| `cssClasses` | Additional CSS classes | array | ["highlighted", "featured"] |
| `theme` | Card theme | string | "default" or "alt" |
| `isLinked` | Whether the card is wrapped in a link | boolean | true |

### Example Card Configuration

```javascript
{
    title: 'Fun Facts',
    content: `
        <p>Discover amazing science facts with Sky!</p>
        <button onclick="showRandomFact()">Show Fact</button>
        <p id="factOutput" style="margin-top: 10px" aria-live="polite"></p>
    `,
    imageUrl: '/learnimals-site/assets/images/science-parrot2.png',
    imageAlt: 'Sky the Science Parrot',
    theme: 'alt'
}
```

## Benefits of Using the Template System with Card.js

- Consistent structure and design across all subject pages
- Easier maintenance (changes to the template affect all pages)
- Reduced duplication of code
- Flexibility to customize content for each subject
- Component-based approach for feature cards
- Improved rendering and styling consistency
- Better separation of data and presentation
- Simplified content management
