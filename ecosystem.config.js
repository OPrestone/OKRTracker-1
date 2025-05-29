module.exports = {
    apps: Array.from({ length: 11 }).map((_, i) => ({
        name: `okr-app-${5000 + i}`,
        script: 'npm',
        args: 'start',
        env: {
            PORT: 5000 + i,
            NODE_ENV: 'production',
        }
    }))
};