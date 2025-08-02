#!/bin/bash

# Coverage Report Script
# Runs tests with coverage and generates reports

echo "🧪 Running tests with coverage..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Run tests with coverage
echo "Running unit tests with coverage..."
npm run test:coverage:unit

# Check if coverage was generated
if [ -f "coverage/lcov.info" ]; then
    echo ""
    echo "✅ Coverage data generated successfully!"
    
    # Display coverage summary
    if [ -f "coverage/coverage-summary.json" ]; then
        echo ""
        echo "📊 Coverage Summary:"
        echo "===================="
        
        # Extract coverage percentages
        LINES=$(cat coverage/coverage-summary.json | jq -r '.total.lines.pct' 2>/dev/null || echo "0")
        STATEMENTS=$(cat coverage/coverage-summary.json | jq -r '.total.statements.pct' 2>/dev/null || echo "0")
        FUNCTIONS=$(cat coverage/coverage-summary.json | jq -r '.total.functions.pct' 2>/dev/null || echo "0")
        BRANCHES=$(cat coverage/coverage-summary.json | jq -r '.total.branches.pct' 2>/dev/null || echo "0")
        
        # Display with colors based on thresholds
        display_metric() {
            local metric=$1
            local value=$2
            local threshold=80
            
            if (( $(echo "$value >= $threshold" | bc -l) )); then
                echo -e "${metric}: ${GREEN}${value}%${NC} ✅"
            elif (( $(echo "$value >= 60" | bc -l) )); then
                echo -e "${metric}: ${YELLOW}${value}%${NC} ⚠️"
            else
                echo -e "${metric}: ${RED}${value}%${NC} ❌"
            fi
        }
        
        display_metric "Lines" "$LINES"
        display_metric "Statements" "$STATEMENTS"
        display_metric "Functions" "$FUNCTIONS"
        display_metric "Branches" "$BRANCHES"
        echo "===================="
    fi
    
    # Generate HTML report
    if [ ! -f "coverage/index.html" ]; then
        echo ""
        echo "Generating HTML coverage report..."
        npx nyc report --reporter=html --report-dir=coverage
    fi
    
    # Open coverage report in browser
    if [ -f "coverage/index.html" ]; then
        echo ""
        echo "📂 Opening coverage report in browser..."
        
        # Detect OS and open appropriately
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open coverage/index.html
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open coverage/index.html
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
            start coverage/index.html
        else
            echo "Please open coverage/index.html in your browser"
        fi
    fi
else
    echo ""
    echo "❌ No coverage data generated. Please check test output for errors."
    exit 1
fi

echo ""
echo "✨ Coverage report complete!"