/**
 * Database Reset Script
 * Drops and recreates the smart_city database from scratch
 * Run this when encountering schema issues
 */

const { Client } = require("pg");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const resetDatabase = async () => {
  const client = new Client({
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: "postgres", // Connect to default postgres db to drop our db
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL");

    // Terminate all connections to the database
    await client.query(
      `
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
    `,
      [process.env.DB_NAME || "smart_city"],
    );

    // Drop database
    console.log(`Dropping database: ${process.env.DB_NAME || "smart_city"}...`);
    await client.query(
      `DROP DATABASE IF EXISTS "${process.env.DB_NAME || "smart_city"}"`,
    );
    console.log("✅ Database dropped");

    // Create database
    console.log(`Creating database: ${process.env.DB_NAME || "smart_city"}...`);
    await client.query(
      `CREATE DATABASE "${process.env.DB_NAME || "smart_city"}" ENCODING 'UTF8'`,
    );
    console.log("✅ Database created");

    console.log("\n✅ Database reset complete!");
    console.log("You can now run: npm start");

    await client.end();
  } catch (error) {
    console.error("❌ Error resetting database:", error.message);
    process.exit(1);
  }
};

resetDatabase();
