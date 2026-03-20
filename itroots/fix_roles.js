const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let newContent = content
        .replace(/\(!user \|\| \(\(user\.role !== "Faculty" && user\.role !== "Faculty"\) && user\.role !== "Faculty"\)\)/g, '(!user || user?.role?.toUpperCase() !== "FACULTY")')
        .replace(/\(!user \|\| \(user\.role !== "Faculty" && user\.role !== "Faculty"\)\)/g, '(!user || user?.role?.toUpperCase() !== "FACULTY")')
        .replace(/\(!user \|\| user\.role !== "Faculty"\)/g, '(!user || user?.role?.toUpperCase() !== "FACULTY")')
        .replace(/user\.role === "Faculty"/g, 'user?.role?.toUpperCase() === "FACULTY"')
        .replace(/user\?\.role === "Faculty"/g, 'user?.role?.toUpperCase() === "FACULTY"')
        .replace(/setIsAttendanceLoading/g, 'setIsAttendanceModal');

    if (content !== newContent) {
        fs.writeFileSync(f, newContent);
        console.log("Updated", f);
    }
});
