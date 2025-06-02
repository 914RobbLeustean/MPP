// proxy.conf.js
const PROXY_CONFIG = [
  {
    context: [
      "/api",
      "/hubs"
    ],
    target: "http://localhost:5043",
    secure: false,
    changeOrigin: true,
    logLevel: "debug"
  }
];

module.exports = PROXY_CONFIG;
