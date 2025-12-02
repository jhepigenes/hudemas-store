const fs = require('fs');
const { execSync } = require('child_process');

try {
    const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    const commitMessage = process.env.RELEASE_NOTE || execSync('git log -1 --pretty=%B').toString().trim();
    const date = new Date().toISOString();
    
    // Fetch history (last 10 commits)
    const historyLog = execSync('git log -n 10 --pretty=format:"%h|%cI|%s"').toString().trim();
    const history = historyLog.split('\n').map(line => {
        const [hash, date, message] = line.split('|');
        return { hash, date, message };
    });

    // Simple versioning strategy: Year.Month.Day-Commit
    const now = new Date();
    const version = `v${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}-${commitHash}`;
    
    const releaseInfo = {
        version,
        lastUpdated: date,
        commit: commitHash,
        note: commitMessage,
        history // Add history here
    };

    fs.writeFileSync('./app/release.json', JSON.stringify(releaseInfo, null, 2));
    console.log('Generated release.json with history');
} catch (e) {
    console.error('Failed to generate release info (git might not be available)', e.message);
    const releaseInfo = {
        version: 'dev-' + Date.now(),
        lastUpdated: new Date().toISOString(),
        commit: 'HEAD',
        note: 'Manual/Dev Build',
        history: []
    };
    fs.writeFileSync('./app/release.json', JSON.stringify(releaseInfo, null, 2));
}
