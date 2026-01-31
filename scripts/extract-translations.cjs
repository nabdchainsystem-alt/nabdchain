/**
 * Extract translations from LanguageContext.tsx to JSON files
 */
const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '../src/contexts/LanguageContext.tsx');
const content = fs.readFileSync(sourceFile, 'utf-8');

// Find the translations object
const translationsStart = content.indexOf('const translations: TranslationMap = {');
const translationsEnd = content.indexOf('const LanguageContext = createContext');

if (translationsStart === -1 || translationsEnd === -1) {
    console.error('Could not find translations object');
    process.exit(1);
}

// Extract the translations block
const translationsBlock = content.substring(translationsStart, translationsEnd);

// Parse TypeScript object using regex to extract key-value pairs
function parseTranslations(block) {
    const translations = {};

    // Match: key: 'value', or key: "value",
    // Handle both single and double quoted values
    const regex = /^\s*(\w+)\s*:\s*(['"])((?:[^'"\\\n]|\\.)*)(['"])\s*,?\s*$/gm;

    let match;
    while ((match = regex.exec(block)) !== null) {
        const key = match[1];
        let value = match[3];

        // Unescape any escaped quotes
        value = value.replace(/\\'/g, "'");
        value = value.replace(/\\"/g, '"');

        translations[key] = value;
    }

    return translations;
}

// Find English and Arabic sections
const enStart = translationsBlock.indexOf('en: {');
const arStart = translationsBlock.indexOf('ar: {');

// Extract English block
const enBlockStart = translationsBlock.indexOf('{', enStart);
let braceCount = 0;
let enBlockEnd = enBlockStart;
for (let i = enBlockStart; i < translationsBlock.length; i++) {
    if (translationsBlock[i] === '{') braceCount++;
    if (translationsBlock[i] === '}') braceCount--;
    if (braceCount === 0) {
        enBlockEnd = i + 1;
        break;
    }
}
const enBlock = translationsBlock.substring(enBlockStart, enBlockEnd);

// Extract Arabic block
const arBlockStart = translationsBlock.indexOf('{', arStart);
braceCount = 0;
let arBlockEnd = arBlockStart;
for (let i = arBlockStart; i < translationsBlock.length; i++) {
    if (translationsBlock[i] === '{') braceCount++;
    if (translationsBlock[i] === '}') braceCount--;
    if (braceCount === 0) {
        arBlockEnd = i + 1;
        break;
    }
}
const arBlock = translationsBlock.substring(arBlockStart, arBlockEnd);

// Parse translations
const enObj = parseTranslations(enBlock);
const arObj = parseTranslations(arBlock);

console.log(`English: ${Object.keys(enObj).length} keys`);
console.log(`Arabic: ${Object.keys(arObj).length} keys`);

// Write JSON files
const localesDir = path.join(__dirname, '../src/locales');
if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
}

fs.writeFileSync(
    path.join(localesDir, 'en.json'),
    JSON.stringify(enObj, null, 2)
);

fs.writeFileSync(
    path.join(localesDir, 'ar.json'),
    JSON.stringify(arObj, null, 2)
);

console.log('Translations extracted successfully!');
console.log(`- ${path.join(localesDir, 'en.json')}`);
console.log(`- ${path.join(localesDir, 'ar.json')}`);
