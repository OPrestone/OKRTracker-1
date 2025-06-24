module.exports = {
	apps: [
		{
			name: "okr",
			script: "pnpm",
            args: "start",
			instances: 1,
			exec_mode: "cluster",
			env: {
				NODE_ENV: "production",
                PORT: 5000,
			},
            increment_var: 'PORT'
		},
	],
};