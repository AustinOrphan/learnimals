#\!/bin/bash

echo "=== Week 1 Cleanup Script ==="

# Configuration duplicates (already done)
echo "Cleaning configuration duplicates..."
find . -maxdepth 1 -type f \( -name "*.toml" -o -name ".dockerignore*" -o -name ".gitleaksignore*" -o -name "Makefile*" -o -name "docker-compose*.yml" -o -name ".lighthouserc*" -o -name "lighthouse*.json" -o -name ".nvmrc*" -o -name ".prettierignore*" \) | grep -E " [0-9]+(\.|$)" | xargs rm -f 2>/dev/null

# Documentation duplicates
echo "Cleaning documentation duplicates..."
find ./docs -name "*.md" | grep -E " [0-9]+\.md$" | xargs rm -f 2>/dev/null
find ./multi_agent_system_docs -name "*.md" -o -name "*.py" | grep -E " [0-9]+\.(md|py)$" | xargs rm -f 2>/dev/null

# Test file duplicates
echo "Cleaning test file duplicates..."
find . -maxdepth 1 -name "test-*.html" | grep -E " [0-9]+\.html$" | xargs rm -f 2>/dev/null
find . -maxdepth 1 -name "debug-*.html" | grep -E " [0-9]+\.html$" | xargs rm -f 2>/dev/null
find ./tests -name "*.bak*" -type f | xargs rm -f 2>/dev/null
find ./tests -name "*.js" | grep -E " [0-9]+\.js$" | xargs rm -f 2>/dev/null

# Source code duplicates
echo "Cleaning source code duplicates..."
find ./src -name "*.js" | grep -E " [0-9]+\.js$" | xargs rm -f 2>/dev/null
find ./scripts -name "*.js" | grep -E " [0-9]+\.js$" | xargs rm -f 2>/dev/null

echo "Week 1 cleanup complete\!"
