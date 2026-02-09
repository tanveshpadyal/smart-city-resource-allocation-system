require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  host: "127.0.0.1",
  port: 5432,
  dialect: "postgres",
  logging: false,
});

module.exports = sequelize;
