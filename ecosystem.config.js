module.exports = {
    apps: [
        {
            name: 'backend',
            cwd: './backend',
            script: 'src/app.js',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                DB_USER: process.env.DB_USER || 'teocan',
                DB_HOST: process.env.DB_HOST || 'localhost',
                DB_NAME: process.env.DB_NAME || 'dogu_as_db',
                DB_PASSWORD: process.env.DB_PASSWORD,
                DB_PORT: process.env.DB_PORT || 5432,
                JWT_SECRET: process.env.JWT_SECRET
            }
        },
        {
            name: 'frontend',
            cwd: './frontend',
            script: '.output/server/index.mjs',
            env: {
                PORT: 3000,
                NITRO_PORT: 3000,
                NODE_ENV: 'production'
            }
        }
    ]
};
