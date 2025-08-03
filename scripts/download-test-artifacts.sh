#!/bin/bash

# Script to download test artifacts from GitHub Actions
# Usage: ./scripts/download-test-artifacts.sh [run-id]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub.${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get the repository name
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

echo -e "${GREEN}📦 Test Artifact Downloader${NC}"
echo "Repository: $REPO"
echo ""

# Get run ID from argument or list recent runs
if [ -z "$1" ]; then
    echo "Recent workflow runs:"
    echo ""
    
    # List recent runs
    gh run list --workflow=ci.yml --limit=10 --json databaseId,headBranch,status,conclusion,createdAt \
        --jq '.[] | "\(.databaseId)\t\(.headBranch)\t\(.status)\t\(.conclusion)\t\(.createdAt)"' | \
        column -t -s $'\t' | nl -w3 -s'. '
    
    echo ""
    read -p "Enter the number of the run to download (or run ID): " selection
    
    if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -le 10 ]; then
        # User selected a number from the list
        RUN_ID=$(gh run list --workflow=ci.yml --limit=10 --json databaseId --jq ".[$((selection-1))].databaseId")
    else
        # User entered a run ID directly
        RUN_ID=$selection
    fi
else
    RUN_ID=$1
fi

echo ""
echo -e "${YELLOW}📥 Downloading artifacts from run: $RUN_ID${NC}"

# Create directory for artifacts
ARTIFACT_DIR="test-artifacts-$RUN_ID"
mkdir -p "$ARTIFACT_DIR"

# List available artifacts
echo ""
echo "Available artifacts:"
gh run view "$RUN_ID" --json artifacts --jq '.artifacts[] | "\(.name)\t\(.sizeInBytes)"' | \
    while IFS=$'\t' read -r name size; do
        # Convert size to human readable
        if [ "$size" -gt 1048576 ]; then
            size_human=$(echo "scale=2; $size / 1048576" | bc)MB
        elif [ "$size" -gt 1024 ]; then
            size_human=$(echo "scale=2; $size / 1024" | bc)KB
        else
            size_human="${size}B"
        fi
        echo "  - $name ($size_human)"
    done

echo ""
echo -e "${YELLOW}Downloading all test-related artifacts...${NC}"

# Download test artifacts
gh run download "$RUN_ID" --dir "$ARTIFACT_DIR" --pattern "*test*" || true
gh run download "$RUN_ID" --dir "$ARTIFACT_DIR" --name "coverage-report" || true
gh run download "$RUN_ID" --dir "$ARTIFACT_DIR" --name "all-test-results-combined" || true

echo ""
echo -e "${GREEN}✅ Artifacts downloaded to: $ARTIFACT_DIR${NC}"

# Check what was downloaded
if [ -d "$ARTIFACT_DIR" ]; then
    echo ""
    echo "Downloaded artifacts:"
    find "$ARTIFACT_DIR" -maxdepth 2 -type d | sed 's|^|  |'
    
    # Generate local HTML viewer
    cat > "$ARTIFACT_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Local Test Results Viewer</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .artifact { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        .artifact h3 { margin-top: 0; color: #007bff; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .path { font-family: monospace; background: #e9ecef; padding: 2px 5px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Local Test Results Viewer</h1>
        <p>Browse test artifacts downloaded from GitHub Actions</p>
        
        <div class="artifact">
            <h3>📊 Coverage Report</h3>
            <p>View code coverage metrics</p>
            <ul>
                <li><a href="coverage-report/index.html">HTML Coverage Report</a></li>
                <li><a href="coverage-report/lcov.info">LCOV Data</a></li>
            </ul>
        </div>
        
        <div class="artifact">
            <h3>🔍 Test Results</h3>
            <p>Browse test results by suite</p>
            <ul>
                <li><a href="all-test-results-combined/index.html">Combined Results</a></li>
                <li><a href="all-test-results-combined/README.md">Summary Report</a></li>
            </ul>
        </div>
        
        <div class="artifact">
            <h3>📁 All Artifacts</h3>
            <p>Browse all downloaded files</p>
            <ul id="file-list"></ul>
        </div>
    </div>
    
    <script>
        // List all HTML and MD files
        const artifacts = [
            'all-test-results-combined/index.html',
            'all-test-results-combined/README.md',
            'coverage-report/index.html',
            'test-results-index/index.html'
        ];
        
        const list = document.getElementById('file-list');
        artifacts.forEach(file => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${file}">${file}</a>`;
            list.appendChild(li);
        });
    </script>
</body>
</html>
EOF
    
    echo ""
    echo -e "${GREEN}📂 View results locally:${NC}"
    echo "  1. Open $ARTIFACT_DIR/index.html in your browser"
    echo "  2. Or run: cd $ARTIFACT_DIR && python -m http.server 8000"
    echo ""
    
    # Offer to open in browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        read -p "Open in browser now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$ARTIFACT_DIR/index.html"
        fi
    fi
else
    echo -e "${RED}❌ No artifacts were downloaded${NC}"
fi