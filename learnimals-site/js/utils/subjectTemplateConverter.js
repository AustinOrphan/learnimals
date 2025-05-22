/**
 * Subject Page Template Converter
 * 
 * This utility helps convert existing subject pages to use the template system.
 * It extracts the necessary information from an existing page and generates
 * the options object needed for the SubjectTemplateLoader.
 */

function extractSubjectPageContent(html) {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract subject information
    const title = doc.querySelector('title').textContent.replace(' - Learnimals', '');
    const subjectLower = extractSubjectFromTitle(title);
    const description = doc.querySelector('meta[name="description"]').getAttribute('content');
    
    // Extract hero content
    const h2Text = doc.querySelector('.hero h2').textContent;
    const characterInfo = extractCharacterInfo(h2Text);
    const heroSubtitle = doc.querySelector('.hero p').textContent;
    
    // Extract feature cards
    const featureCardsSection = doc.querySelector('.features');
    const featureCards = featureCardsSection.innerHTML.trim();
    
    return {
        subjectName: title,
        subjectLower,
        subjectDescription: description,
        characterName: characterInfo.name,
        characterType: characterInfo.type,
        heroSubtitle,
        featureCards
    };
}

function extractSubjectFromTitle(title) {
    // Extract the subject name from the title and convert to lowercase
    const match = title.match(/^(\w+)/i);
    return match ? match[1].toLowerCase() : '';
}

function extractCharacterInfo(h2Text) {
    // Extract character name and type from heading text
    // Example: "Math Tools with Mango the Shark!"
    const match = h2Text.match(/with\s+(\w+)\s+the\s+(\w+)/i);
    if (match) {
        return {
            name: match[1],
            type: match[2]
        };
    }
    return { name: '', type: '' };
}

function generateTemplateCode(options) {
    // Generate the code to use the template
    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${options.subjectName} - Learnimals</title>
        <script type="module">
            import SubjectTemplateLoader from '/learnimals-site/js/utils/subjectTemplateLoader.js';

            // Define content for ${options.subjectLower} page
            const ${options.subjectLower}Options = {
                subjectName: '${options.subjectName}',
                subjectLower: '${options.subjectLower}',
                subjectDescription: '${options.subjectDescription}',
                characterName: '${options.characterName}',
                characterType: '${options.characterType}',
                heroSubtitle: '${options.heroSubtitle}',
                featureCards: \`
${options.featureCards}
                \`
            };

            // Render the template with ${options.subjectLower}-specific content
            document.addEventListener('DOMContentLoaded', async () => {
                await SubjectTemplateLoader.renderTemplate(${options.subjectLower}Options);
            });
        </script>
    </head>
    <body>
        <!-- This content will be replaced by the template -->
        <p>Loading ${options.subjectLower} content...</p>
    </body>
</html>`;
}

// Example usage:
// 1. Fetch an existing subject page
// const response = await fetch('/subjects/math.html');
// const html = await response.text();
// 
// 2. Extract content and options
// const options = extractSubjectPageContent(html);
// 
// 3. Generate template code
// const templateCode = generateTemplateCode(options);
// 
// 4. Output or save the template code
// console.log(templateCode);

export { extractSubjectPageContent, generateTemplateCode };
