module.exports = {
    apps: [
        {
            name: 'backend',
            cwd: './backend',
            script: 'src/app.js',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                DB_USER: 'teocan',
                DB_HOST: 'localhost',
                DB_NAME: 'dogu_as_db',
                DB_PASSWORD: 'teocan123',
                DB_PORT: 5432,
                JWT_SECRET: 'doguas_secret_key_2024'
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
