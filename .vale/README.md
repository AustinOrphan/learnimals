# Vale Prose Linting Configuration

This directory contains the Vale configuration for the Learnimals project. Vale is a syntax-aware
linter for prose that helps maintain consistent documentation style.

## Configuration Structure

```text
.vale/
├── README.md                    # This file
├── styles/                      # Style guide directory
│   └── Learnimals/             # Custom Learnimals style guide
│       ├── meta.json           # Style metadata
│       ├── Vocabulary.txt      # Custom vocabulary/spelling exceptions
│       ├── ConsistentTerminology.yml  # Term standardization rules
│       └── TechnicalWriting.yml       # Writing style rules
└── .vale.ini                   # Main Vale configuration (in project root)
```

## Usage

### Running Vale

```bash
# Check all markdown files
npm run prose:check

# Check specific files
npm run prose:readme

# Check a single file
vale path/to/file.md

# Check with specific style
vale --config=.vale.ini path/to/file.md
```

### Understanding Output

Vale provides three levels of alerts:

- **Error** (❌): Must fix - spelling errors, critical style violations
- **Warning** (⚠️): Should fix - important style suggestions
- **Suggestion** (💡): Consider fixing - minor style improvements

## Custom Vocabulary

The `Vocabulary.txt` file contains project-specific terms that Vale should accept:

- Project names (Learnimals)
- Technology terms (npm, ESLint, Vitest, etc.)
- File extensions and commands
- Component names
- Common abbreviations

To add a new term, simply add it to the appropriate section in `Vocabulary.txt`.

## Style Rules

### Learnimals Custom Rules

1. **ConsistentTerminology.yml**: Ensures consistent use of technical terms
   - `frontend` not `front-end` or `front end`
   - `README` not `readme` or `Readme`

2. **TechnicalWriting.yml**: Removes unnecessary filler words
   - Avoids: simply, obviously, clearly, just, basically

### External Style Guides

We use Microsoft and Google style guides as a base, with many rules adjusted or disabled for
technical documentation:

- Passive voice: Changed from error to suggestion
- Contractions: Disabled (we allow them)
- First person: Disabled (we allow "we" in docs)
- Parentheses: Disabled (common in technical docs)
- Heading capitalization: Disabled (we use sentence case)

## File-Specific Rules

Different documentation types have different requirements:

- **Architecture Decision Records** (`docs/architecture/*.md`): Passive voice allowed
- **API Documentation** (`docs/development/api/*.md`): Technical acronyms allowed
- **Testing Documentation** (`docs/testing/*.md`): Technical language allowed
- **HTML Files**: Lighter spelling checks
- **Code Files** (`*.js`, `*.ts`): Only check comments, lighter rules

## Customizing Rules

### Adding a New Rule

1. Create a new YAML file in `.vale/styles/Learnimals/`
2. Define the rule using Vale's syntax
3. Add it to the appropriate section in `.vale.ini`

### Modifying Severity

In `.vale.ini`, you can set rule severity:

```ini
# Disable a rule
RuleName = NO

# Make it a suggestion
RuleName = suggestion

# Make it a warning
RuleName = warning

# Make it an error
RuleName = error
```

## Integration

Vale is integrated into our CI/CD pipeline and can be run:

- Manually via npm scripts
- As a pre-commit hook (if configured)
- In CI/CD pipelines for PR checks

## Troubleshooting

### Common Issues

1. **Too many spelling errors**: Add terms to `Vocabulary.txt`
2. **Rule too strict**: Adjust severity in `.vale.ini`
3. **False positives in code**: Check `BlockIgnores` patterns

### Debugging

```bash
# Show Vale configuration
vale ls-config

# Check which styles are active
vale ls-metrics

# Sync packages (download Microsoft/Google styles)
vale sync
```

## Resources

- [Vale Documentation](https://vale.sh/docs/)
- [Vale Rule Reference](https://vale.sh/docs/topics/styles/)
- [Microsoft Style Guide](https://docs.microsoft.com/en-us/style-guide/welcome/)
- [Google Developer Documentation Style Guide](https://developers.google.com/style)
