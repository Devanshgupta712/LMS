const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.tsx') || file.endsWith('.css')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./src');
const skipFiles = ['globals.css', 'Navbar.tsx', 'Hero.tsx', 'Courses.tsx', 'Footer.tsx'];

let modifiedCount = 0;

files.forEach(file => {
    if (skipFiles.some(skip => file.endsWith(skip))) return;

    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace hardcoded white backgrounds with deep dark theme cards
    content = content.replace(/background:\s*['"]#(fff|ffffff|f8fafc|f6f9fc|f1f5f9)['"]/gi, "background: 'var(--bg-primary)'");
    content = content.replace(/backgroundColor:\s*['"]#(fff|ffffff|f8fafc|f6f9fc|f1f5f9)['"]/gi, "backgroundColor: 'var(--bg-card)'");
    
    // Also remove any hardcoded text colors that clash with dark mode
    content = content.replace(/color:\s*['"]#(000|1a1a2e|333|222|0f172a)['"]/gi, "color: 'var(--text-primary)'");
    content = content.replace(/color:\s*['"]#(475569|64748b|94a3b8)['"]/gi, "color: 'var(--text-secondary)'");

    // Clean up hard borders that break dark mode blending
    content = content.replace(/border:\s*['"](1px solid #[a-fA-F0-9]+)['"]/gi, "border: '1px solid var(--border)'");

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Normalized Colors ->', file);
        modifiedCount++;
    }
});

console.log(`\nColor normalization complete. Modified ${modifiedCount} files.`);
