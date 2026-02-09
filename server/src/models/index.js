const sequelize = require("../config/database");

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

module.exports = connectDB;
