const fs = require('fs');
const { execSync } = require('child_process');

try {
    const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
    const date = new Date().toISOString();
    
    // Simple versioning strategy: Year.Month.Day-Commit
    const now = new Date();
    const version = `v${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}-${commitHash}`;
    
    const releaseInfo = {
        version,
        lastUpdated: date,
        commit: commitHash,
        note: commitMessage
    };

    fs.writeFileSync('./app/release.json', JSON.stringify(releaseInfo, null, 2));
    console.log('Generated release.json:', releaseInfo);
} catch (e) {
    console.error('Failed to generate release info (git might not be available)', e.message);
    const releaseInfo = {
        version: 'dev-' + Date.now(),
        lastUpdated: new Date().toISOString(),
        commit: 'HEAD',
        note: 'Manual/Dev Build'
    };
    fs.writeFileSync('./app/release.json', JSON.stringify(releaseInfo, null, 2));
}
