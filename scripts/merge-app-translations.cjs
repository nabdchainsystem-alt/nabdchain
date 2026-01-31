/**
 * Merge AppContext translations into existing JSON locale files
 */
const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '../src/contexts/AppContext.tsx');
const content = fs.readFileSync(sourceFile, 'utf-8');

// Find the translations object
const translationsStart = content.indexOf('const translations: Translations = {');
const translationsEnd = content.indexOf('interface AppContextType');

if (translationsStart === -1 || translationsEnd === -1) {
    console.error('Could not find translations object');
    process.exit(1);
}

// Extract translations block
const translationsBlock = content.substring(translationsStart, translationsEnd);

// Parse AppContext translations which use format: key: { en: 'value', ar: 'value' }
function parseAppContextTranslations(block) {
    const enTranslations = {};
    const arTranslations = {};

    // Match: key: { en: 'value', ar: 'value' }, or variants with double quotes
    const regex = /^\s*['"]?(\w+)['"]?\s*:\s*\{\s*en\s*:\s*(['"])((?:[^'"\\]|\\.)*)(['"])\s*,\s*ar\s*:\s*(['"])((?:[^'"\\]|\\.)*)(['"])\s*\}/gm;

    let match;
    while ((match = regex.exec(block)) !== null) {
        const key = match[1];
        let enValue = match[3];
        let arValue = match[6];

        // Unescape quotes
        enValue = enValue.replace(/\\'/g, "'").replace(/\\"/g, '"');
        arValue = arValue.replace(/\\'/g, "'").replace(/\\"/g, '"');

        enTranslations[key] = enValue;
        arTranslations[key] = arValue;
    }

    return { en: enTranslations, ar: arTranslations };
}

const appTranslations = parseAppContextTranslations(translationsBlock);
console.log(`Found ${Object.keys(appTranslations.en).length} AppContext translations`);

// Load existing translations
const enJsonPath = path.join(__dirname, '../src/locales/en.json');
const arJsonPath = path.join(__dirname, '../src/locales/ar.json');

const existingEn = JSON.parse(fs.readFileSync(enJsonPath, 'utf-8'));
const existingAr = JSON.parse(fs.readFileSync(arJsonPath, 'utf-8'));

// Merge (AppContext translations take precedence for overlapping keys)
const mergedEn = { ...existingEn, ...appTranslations.en };
const mergedAr = { ...existingAr, ...appTranslations.ar };

console.log(`English: ${Object.keys(existingEn).length} -> ${Object.keys(mergedEn).length} keys`);
console.log(`Arabic: ${Object.keys(existingAr).length} -> ${Object.keys(mergedAr).length} keys`);

// Write merged files
fs.writeFileSync(enJsonPath, JSON.stringify(mergedEn, null, 2));
fs.writeFileSync(arJsonPath, JSON.stringify(mergedAr, null, 2));

console.log('Translations merged successfully!');
