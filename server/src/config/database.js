require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const { Sequelize } = require("sequelize");

const baseConfig = {
  dialect: "postgres",
  logging: false,
};

const useSsl =
  process.env.DB_SSL === "true" || process.env.PGSSLMODE === "require";

if (useSsl) {
  baseConfig.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, baseConfig)
  : new Sequelize({
      ...baseConfig,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: String(process.env.DB_PASSWORD || ""),
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 5432),
    });

module.exports = sequelize;
