# Configuration File Deduplication Plan

## Summary
I've analyzed all duplicate configuration files in the root directory. The majority are exact duplicates that can be safely removed, with a few exceptions requiring version updates.

## File-by-File Analysis & Recommendations

### 1. `.dockerignore` Files
- **Status**: All 4 files are identical
- **Recommendation**: Keep `.dockerignore`, delete `.dockerignore 2`, `.dockerignore 3`, `.dockerignore 4`
- **Rationale**: No differences found between any versions

### 2. `.gitleaks.toml` Files  
- **Status**: All 3 files are identical
- **Recommendation**: Keep `.gitleaks.toml`, delete `.gitleaks 2.toml`, `.gitleaks 3.toml`
- **Rationale**: No differences found between any versions

### 3. `.gitleaksignore` Files
- **Status**: All 4 files are identical
- **Recommendation**: Keep `.gitleaksignore`, delete `.gitleaksignore 2`, `.gitleaksignore 3`, `.gitleaksignore 4`
- **Rationale**: No differences found between any versions

### 4. `.nvmrc` Files ⚠️ **REQUIRES UPDATE**
- **Status**: Version conflict detected
- **Current**: `.nvmrc` = `20.15.1`, others = `20`
- **Recommendation**: 
  - Update `.nvmrc` to `24.15.1` (to match project's current Node 24 usage)
  - Delete `.nvmrc 2`, `.nvmrc 3`, `.nvmrc 4`
- **Rationale**: Project uses Node 24 (per Dockerfile), but .nvmrc specifies Node 20

### 5. `.prettierrc.json` Files
- **Status**: Both files are identical
- **Recommendation**: Keep `.prettierrc.json`, delete `.prettierrc 2.json`
- **Rationale**: No differences found

### 6. `.prettierignore` Files
- **Status**: Both files are identical  
- **Recommendation**: Keep `.prettierignore`, delete `.prettierignore 2`
- **Rationale**: No differences found

### 7. `Dockerfile` Files ⚠️ **REQUIRES UPDATE**
- **Status**: Version differences in nginx version
- **Current**: `Dockerfile` uses nginx:1.27-alpine3.19, others use nginx:1.25-alpine3.19
- **Recommendation**: 
  - Keep `Dockerfile` (has most recent nginx version)
  - Delete `Dockerfile 2`, `Dockerfile 3`, `Dockerfile 4`
- **Rationale**: Main Dockerfile has the most up-to-date nginx version (1.27 vs 1.25)

### 8. `Makefile` Files
- **Status**: All 4 files are identical
- **Recommendation**: Keep `Makefile`, delete `Makefile 2`, `Makefile 3`, `Makefile 4`
- **Rationale**: No differences found between any versions

### 9. `docker-compose.yml` Files
- **Status**: All 3 files are identical
- **Recommendation**: Keep `docker-compose.yml`, delete `docker-compose 2.yml`, `docker-compose 3.yml`
- **Rationale**: No differences found between any versions

### 10. Lighthouse Configuration Files
- **Status**: All files are identical within their respective types
- **Recommendation**: 
  - Keep `.lighthouserc.json`, delete `.lighthouserc 2.json`, `.lighthouserc 3.json`
  - Keep `lighthouse-budget.json`, delete `lighthouse-budget 2.json`, `lighthouse-budget 3.json`
  - Keep environment-specific configs: `.lighthouserc.production.json`, `.lighthouserc.staging.json`
- **Rationale**: Environment-specific configs serve different purposes and should be retained

## Implementation Plan

### Phase 1: Update Configuration Versions
1. Update `.nvmrc` from `20.15.1` to `24` (to match project's Node 24 usage)
2. Verify `Dockerfile` is the correct version to keep (nginx:1.27 vs 1.25)

### Phase 2: Remove Duplicate Files (36 files total)
**Safe to delete** (identical duplicates):
- `.dockerignore 2`, `.dockerignore 3`, `.dockerignore 4` (3 files)
- `.gitleaks 2.toml`, `.gitleaks 3.toml` (2 files)  
- `.gitleaksignore 2`, `.gitleaksignore 3`, `.gitleaksignore 4` (3 files)
- `.nvmrc 2`, `.nvmrc 3`, `.nvmrc 4` (3 files)
- `.prettierrc 2.json` (1 file)
- `.prettierignore 2` (1 file)
- `Dockerfile 2`, `Dockerfile 3`, `Dockerfile 4` (3 files)
- `Makefile 2`, `Makefile 3`, `Makefile 4` (3 files)
- `docker-compose 2.yml`, `docker-compose 3.yml` (2 files)
- `.lighthouserc 2.json`, `.lighthouserc 3.json` (2 files)
- `lighthouse-budget 2.json`, `lighthouse-budget 3.json` (2 files)
- `lighthouserc 2.json`, `lighthouserc 3.json` (2 files)

### Phase 3: Verification
1. Run `npm run lint` to ensure no configuration issues
2. Test Docker build with updated Dockerfile
3. Verify development environment still works with updated .nvmrc

## Risk Assessment
- **Low Risk**: Removing identical duplicate files
- **Medium Risk**: Updating .nvmrc (may require developers to switch Node versions)
- **Low Risk**: Keeping most recent Dockerfile version

## Benefits
- Eliminates 36+ duplicate configuration files
- Reduces repository size and complexity
- Ensures consistent configuration across the project
- Aligns Node.js version with actual project usage