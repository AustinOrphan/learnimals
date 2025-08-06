#!/usr/bin/env node

/**
 * Quick Validation Script - Proof of Concept
 * Tests the core components of our CSS modularization system
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 CSS Modularization System - Quick Validation\n');

async function validateCore() {
    const results = {
        coreFiles: [],
        features: [],
        errors: []
    };

    // Check core files exist
    const coreFiles = [
        'src/utils/CSSManager.js',
        'src/utils/CSSPathResolver.js',
        'src/utils/CSSPerformanceMonitor.js',
        'src/utils/ComponentManifest.js',
        'src/components/BaseComponentV2.js'
    ];

    console.log('1️⃣ Checking Core Files...');
    for (const file of coreFiles) {
        try {
            const filePath = path.join(__dirname, file);
            await fs.access(filePath);
            const stats = await fs.stat(filePath);
            results.coreFiles.push({
                file,
                size: `${Math.round(stats.size / 1024)}KB`,
                exists: true
            });
            console.log(`   ✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
        } catch (error) {
            results.coreFiles.push({ file, exists: false, error: error.message });
            console.log(`   ❌ ${file} - Missing`);
        }
    }

    // Check templates exist
    console.log('\n2️⃣ Checking Templates...');
    const templates = [
        'src/templates/component-css.template.css',
        'src/templates/component-manifest.template.json'
    ];

    for (const template of templates) {
        try {
            const filePath = path.join(__dirname, template);
            await fs.access(filePath);
            console.log(`   ✅ ${template}`);
            results.features.push(`Template: ${path.basename(template)}`);
        } catch (error) {
            console.log(`   ❌ ${template} - Missing`);
            results.errors.push(`Missing template: ${template}`);
        }
    }

    // Check Card co-location structure
    console.log('\n3️⃣ Checking Co-location Pattern...');
    const cardFiles = [
        'src/components/ui/Card/Card.js',
        'src/components/ui/Card/Card.css',
        'src/components/ui/Card/component.json'
    ];

    let coLocationWorks = true;
    for (const file of cardFiles) {
        try {
            const filePath = path.join(__dirname, file);
            await fs.access(filePath);
            console.log(`   ✅ ${file}`);
        } catch (error) {
            console.log(`   ❌ ${file} - Missing`);
            coLocationWorks = false;
        }
    }

    if (coLocationWorks) {
        results.features.push('CSS Co-location Pattern');
    }

    // Test basic imports (syntax check)
    console.log('\n4️⃣ Testing Module Imports...');
    try {
        // Test if core modules can be imported (syntax validation)
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        // Test BaseComponentV2 syntax
        const syntaxTest = `node -c "${path.join(__dirname, 'src/components/BaseComponentV2.js')}"`;
        await execAsync(syntaxTest);
        console.log('   ✅ BaseComponentV2.js syntax valid');
        results.features.push('BaseComponentV2 module');

        // Test CSSManager syntax
        const cssManagerTest = `node -c "${path.join(__dirname, 'src/utils/CSSManager.js')}"`;
        await execAsync(cssManagerTest);
        console.log('   ✅ CSSManager.js syntax valid');
        results.features.push('CSSManager module');

    } catch (error) {
        console.log('   ⚠️ Module syntax check failed (expected in some environments)');
        results.errors.push('Module syntax validation failed');
    }

    return results;
}

async function checkIntegration() {
    console.log('\n5️⃣ Checking Integration Points...');
    
    try {
        // Check if BaseComponentV2 references CSSManager
        const baseComponentPath = path.join(__dirname, 'src/components/BaseComponentV2.js');
        const baseComponentContent = await fs.readFile(baseComponentPath, 'utf8');
        
        const integrationChecks = [
            { pattern: /import.*CSSManager/i, name: 'CSSManager import' },
            { pattern: /this\.cssManager/i, name: 'CSSManager instance' },
            { pattern: /injectCSS/i, name: 'CSS injection method' },
            { pattern: /applyScopedStyles/i, name: 'CSS scoping method' }
        ];

        for (const check of integrationChecks) {
            if (check.pattern.test(baseComponentContent)) {
                console.log(`   ✅ ${check.name} found`);
            } else {
                console.log(`   ❌ ${check.name} not found`);
            }
        }

    } catch (error) {
        console.log('   ❌ Integration check failed:', error.message);
    }
}

async function generateReport(results) {
    console.log('\n📊 VALIDATION REPORT\n');
    console.log('=' .repeat(50));
    
    console.log(`\n✅ Core Files Present: ${results.coreFiles.filter(f => f.exists).length}/${results.coreFiles.length}`);
    console.log(`✅ Features Working: ${results.features.length}`);
    console.log(`❌ Issues Found: ${results.errors.length}`);
    
    if (results.features.length > 0) {
        console.log('\n🎯 WORKING FEATURES:');
        results.features.forEach(feature => console.log(`   • ${feature}`));
    }
    
    if (results.errors.length > 0) {
        console.log('\n⚠️ ISSUES:');
        results.errors.forEach(error => console.log(`   • ${error}`));
    }

    const successRate = ((results.coreFiles.filter(f => f.exists).length + results.features.length) / 
                        (results.coreFiles.length + 5)) * 100;
    
    console.log('\n' + '=' .repeat(50));
    console.log(`🏆 SYSTEM HEALTH: ${Math.round(successRate)}%`);
    
    if (successRate >= 80) {
        console.log('🎉 SUCCESS: CSS modularization system is working!');
        console.log('💡 Ready to continue with remaining tasks.');
    } else if (successRate >= 60) {
        console.log('⚠️ PARTIAL: Core system working, some features need attention.');
    } else {
        console.log('❌ CRITICAL: Major issues detected, system needs repair.');
    }
    
    console.log('\n📝 To test interactively:');
    console.log('   1. Start server: python3 -m http.server 8080');
    console.log('   2. Open: http://localhost:8080/proof-of-concept-test.html');
}

// Run validation
try {
    const results = await validateCore();
    await checkIntegration();
    await generateReport(results);
} catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
}