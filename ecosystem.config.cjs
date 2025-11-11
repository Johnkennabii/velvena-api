module.exports = {
  apps: [
    {
      name: "allure-api",
      script: "dist/server.js",
      cwd: "/var/www/allure-api",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HETZNER_ACCESS_KEY: "T4WOQY0906ZIGNB5YO6V",
        HETZNER_SECRET_KEY: "KjPx09ZPyueYYCNzI9OZNs07YC4UnQL4Ahrwm6rX"
      }
    }
  ]
};