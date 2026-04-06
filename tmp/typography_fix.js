const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.css')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
const skipFiles = ['Navbar.tsx', 'Hero.tsx', 'Courses.tsx', 'globals.css'];

let modifiedCount = 0;

files.forEach(file => {
    if (skipFiles.some(skip => file.endsWith(skip))) return;

    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Normalize to modern SaaS scale
    content = content.replace(/fontWeight:\s*950/g, 'fontWeight: 800');
    content = content.replace(/fontWeight:\s*900/g, 'fontWeight: 700');
    content = content.replace(/fontWeight:\s*850/g, 'fontWeight: 700');
    content = content.replace(/fontWeight:\s*800/g, 'fontWeight: 600');
    
    // Normalize overly squished letter spacing
    content = content.replace(/letterSpacing:\s*['"]-0\.06em['"]/g, "letterSpacing: '-0.04em'");
    content = content.replace(/letterSpacing:\s*['"]-0\.05em['"]/g, "letterSpacing: '-0.03em'");

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Normalized Typography ->', file);
        modifiedCount++;
    }
});

console.log(`\nTypography normalization complete. Modified ${modifiedCount} files.`);
