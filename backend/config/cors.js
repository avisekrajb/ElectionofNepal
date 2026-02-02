const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'https://nepal-election-frontend.onrender.com',
  // Add other production domains here
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = corsOptions;