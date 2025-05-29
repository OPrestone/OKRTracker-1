export default {
    apps: Array.from({ length: 11 }).map((_, i) => ({
        name: `react-backend-${5000 + i}`,
        script: 'npm',
        args: 'start',
        env: {
            PORT: 5000 + i,
            NODE_ENV: 'production',
        },
    })),
};