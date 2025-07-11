# Suggested Development Commands

## Local Development Server
This is a static site with no build process. Use any local web server:

### Python (if available)
```bash
python -m http.server 8000
# or for Python 3
python3 -m http.server 8000
```

### Node.js (if available) 
```bash
npx serve .
# or
npx http-server
```

### PHP (if available)
```bash
php -S localhost:8000
```

### VS Code Live Server
Use the Live Server extension in VS Code

## Navigation
- **Entry Point**: `/src/pages/index.html`
- **Subject Pages**: Located in `/src/features/subjects/shared/`
- **Games**: Located in `/src/features/games/`

## File Operations
```bash
# List files
ls -la

# Find files by pattern  
find . -name "*.js" -type f

# Search within files
grep -r "pattern" src/

# Show file contents
cat filename

# Edit files
nano filename
vim filename
```

## Git Operations
```bash
git status
git add .
git commit -m "message"
git push origin main
```

## System Commands (macOS)
```bash
# Show current directory
pwd

# Change directory
cd /path/to/directory

# Copy files
cp source destination

# Move/rename files
mv source destination

# Remove files (be careful!)
rm filename
```

## Testing
- **Manual Testing**: Load in browser and test functionality
- **Browser DevTools**: Use for debugging and performance analysis
- **Mobile Testing**: Use browser responsive mode or actual devices
- **PWA Testing**: Test offline functionality and install behavior