// config/mongodb.js

const { getConfig } = require('dotenv-handler');
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(`${getConfig('MONGODB_URL')}`);
    console.log('MongoDB connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
