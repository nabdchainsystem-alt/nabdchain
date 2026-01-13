const fs = require('fs');
const content = fs.readFileSync('/Users/max/nabd/src/components/layout/Sidebar.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let results = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Simple regex for tags
    const openTags = [...line.matchAll(/<div/g)];
    const closeTags = [...line.matchAll(/<\/div/g)];

    openTags.forEach(() => {
        stack.push(lineNum);
    });

    closeTags.forEach(() => {
        if (stack.length > 0) {
            stack.pop();
        } else {
            results.push(`Extra closing tag at line ${lineNum}`);
        }
    });
}

console.log("Unclosed tags (opening line numbers):", stack);
console.log(results.join('\n'));
