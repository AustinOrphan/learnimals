#!/usr/bin/env node

/**
 * Setup or update Git hooks for the Learnimals project
 * 
 * This script ensures all developers have the latest hooks installed
 * and configured correctly.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

/**
 * Check if Husky is installed
 */
function checkHusky() {
  const huskyPath = path.join(process.cwd(), '.husky');
  return fs.existsSync(huskyPath);
}

/**
 * Install Husky
 */
function installHusky() {
  console.log(`${colors.blue}📦 Installing Husky...${colors.reset}`);
  try {
    execSync('npx husky install', { stdio: 'inherit' });
    console.log(`${colors.green}✅ Husky installed successfully${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Failed to install Husky${colors.reset}`);
    return false;
  }
}

/**
 * Check if a hook exists and is executable
 */
function checkHook(hookName) {
  const hookPath = path.join(process.cwd(), '.husky', hookName);
  if (!fs.existsSync(hookPath)) {
    return { exists: false, executable: false };
  }
  
  try {
    fs.accessSync(hookPath, fs.constants.X_OK);
    return { exists: true, executable: true };
  } catch {
    return { exists: true, executable: false };
  }
}

/**
 * Make hook executable
 */
function makeExecutable(hookName) {
  const hookPath = path.join(process.cwd(), '.husky', hookName);
  try {
    fs.chmodSync(hookPath, '755');
    console.log(`${colors.green}✅ Made ${hookName} executable${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Failed to make ${hookName} executable${colors.reset}`);
    return false;
  }
}

/**
 * Verify hook content
 */
function verifyHookContent(hookName) {
  const hookPath = path.join(process.cwd(), '.husky', hookName);
  const content = fs.readFileSync(hookPath, 'utf8');
  
  const requiredChecks = [
    'duplicate files',
    'conflict markers',
    'large files',
    'TODO/FIXME',
    'lint-staged'
  ];
  
  const missingChecks = requiredChecks.filter(check => 
    !content.toLowerCase().includes(check.toLowerCase())
  );
  
  if (missingChecks.length > 0) {
    console.log(`${colors.yellow}⚠️  ${hookName} is missing checks for: ${missingChecks.join(', ')}${colors.reset}`);
    return false;
  }
  
  return true;
}

/**
 * Check Git configuration
 */
function checkGitConfig() {
  try {
    const coreHooksPath = execSync('git config core.hooksPath', { encoding: 'utf8' }).trim();
    if (coreHooksPath && coreHooksPath !== '.husky') {
      console.log(`${colors.yellow}⚠️  Git hooks path is set to: ${coreHooksPath}${colors.reset}`);
      console.log(`${colors.yellow}   This might prevent Husky hooks from running.${colors.reset}`);
      return false;
    }
  } catch {
    // core.hooksPath not set, which is fine
  }
  return true;
}

/**
 * Main setup function
 */
async function main() {
  console.log(`${colors.blue}🔧 Setting up Git hooks for Learnimals...${colors.reset}\n`);
  
  let success = true;
  
  // Check if we're in a git repository
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
  } catch {
    console.error(`${colors.red}❌ Not in a Git repository!${colors.reset}`);
    process.exit(1);
  }
  
  // Check Git configuration
  console.log(`${colors.blue}1️⃣  Checking Git configuration...${colors.reset}`);
  if (!checkGitConfig()) {
    console.log(`${colors.yellow}   Consider running: git config --unset core.hooksPath${colors.reset}`);
  }
  
  // Check/Install Husky
  console.log(`\n${colors.blue}2️⃣  Checking Husky installation...${colors.reset}`);
  if (!checkHusky()) {
    if (!installHusky()) {
      process.exit(1);
    }
  } else {
    console.log(`${colors.green}✅ Husky is installed${colors.reset}`);
  }
  
  // Check pre-commit hook
  console.log(`\n${colors.blue}3️⃣  Checking pre-commit hook...${colors.reset}`);
  const preCommit = checkHook('pre-commit');
  
  if (!preCommit.exists) {
    console.log(`${colors.red}❌ pre-commit hook not found${colors.reset}`);
    console.log(`${colors.yellow}   Run: npx husky add .husky/pre-commit "npm run pre-commit"${colors.reset}`);
    success = false;
  } else {
    console.log(`${colors.green}✅ pre-commit hook exists${colors.reset}`);
    
    if (!preCommit.executable) {
      makeExecutable('pre-commit');
    }
    
    if (!verifyHookContent('pre-commit')) {
      console.log(`${colors.yellow}   Consider updating the pre-commit hook with latest checks${colors.reset}`);
    }
  }
  
  // Check for required scripts
  console.log(`\n${colors.blue}4️⃣  Checking required scripts...${colors.reset}`);
  const requiredScripts = ['scripts/checkDuplicates.js'];
  
  requiredScripts.forEach(script => {
    if (fs.existsSync(script)) {
      console.log(`${colors.green}✅ ${script} exists${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ ${script} not found${colors.reset}`);
      success = false;
    }
  });
  
  // Check package.json scripts
  console.log(`\n${colors.blue}5️⃣  Checking package.json scripts...${colors.reset}`);
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredNpmScripts = ['prepare', 'pre-commit'];
  
  requiredNpmScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`${colors.green}✅ npm script '${script}' is defined${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ npm script '${script}' is missing${colors.reset}`);
      success = false;
    }
  });
  
  // Summary
  console.log(`\n${colors.blue}📊 Summary:${colors.reset}`);
  if (success) {
    console.log(`${colors.green}✅ All Git hooks are properly configured!${colors.reset}`);
    console.log(`\n${colors.blue}Next time you commit, you'll see:${colors.reset}`);
    console.log('  - Duplicate file detection');
    console.log('  - Merge conflict detection');
    console.log('  - Large file warnings');
    console.log('  - TODO/FIXME reminders');
    console.log('  - Automatic code formatting and linting');
  } else {
    console.log(`${colors.yellow}⚠️  Some issues need attention${colors.reset}`);
    console.log(`\n${colors.blue}To fix:${colors.reset}`);
    console.log('1. Run: npm install');
    console.log('2. Run: npm run prepare');
    console.log('3. Run this script again to verify');
  }
  
  console.log(`\n${colors.blue}For more information, see: docs/development/GIT_HOOKS.md${colors.reset}`);
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});

export { checkHusky, checkHook, verifyHookContent };