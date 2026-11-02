const mongoose = require("mongoose");
const dns = require("dns");

// Resolve DNS SRV on Windows machines connecting to MongoDB Atlas
if (process.platform === "win32") {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  } catch (err) {
    console.warn("Could not set custom DNS servers:", err.message);
  }
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.error("MongoDB connection error: Neither MONGODB_URI nor MONGO_URI is configured in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);

    console.log("MongoDB connected successfully!");
    console.log(`Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
