require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const { Sequelize } = require("sequelize");

const isRender = !!process.env.DATABASE_URL;

const sequelize = isRender
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    })
  : new Sequelize({
      dialect: "postgres",
      logging: false,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: String(process.env.DB_PASSWORD || ""),
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 5432),
    });

module.exports = sequelize;
