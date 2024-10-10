const allowedOrigin = [
      "http://localhost:3500",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://9c39rdqg-5173.uks1.devtunnels.ms",
      "https://9c39rdqg-3500.uks1.devtunnels.ms",
      process.env.FRONTEND_URL,
      process.env.ADMIN_FRONTEND_URL 
];

module.exports = allowedOrigin;