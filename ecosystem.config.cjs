// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'stockgenius-backend',
      script: './src/index.js',
      env: {
        NODE_ENV: 'development',
        PORT: 8080,
        MONGODB_URI: 'mongodb+srv://sweetdesignhub:Dosci2Sh8IdWXypz@ai-stockscope.zgmev0u.mongodb.net',
        JWT_SECRET: 'LKBjkb3KJ24BKJBjbkjbkJKBKJB2545225kjb25kjbk',
	FYERS_APP_ID='N5EAZQWVW3-102',
	FYERS_SECRET_KEY='IKAJPGN7LM',
	FYERS_REDIRECT_URI='https://stockgenius.ai/india/portfolio/',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
        MONGODB_URI: 'mongodb+srv://sweetdesignhub:Dosci2Sh8IdWXypz@ai-stockscope.zgmev0u.mongodb.net',
        JWT_SECRET: 'LKBjkb3KJ24BKJBjbkjbkJKBKJB2545225kjb25kjbk',
	FYERS_APP_ID='N5EAZQWVW3-102',
	FYERS_SECRET_KEY='IKAJPGN7LM',
	FYERS_REDIRECT_URI='https://stockgenius.ai/india/portfolio/',
      },
    },
  ],
};
