const sequelize = require("./database");

const ensureDispatchSchema = async () => {
  await sequelize.query(`
    ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "max_active_complaints" INTEGER NOT NULL DEFAULT 10;
  `);

  await sequelize.query(`
    ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "last_assigned_at" TIMESTAMP WITH TIME ZONE;
  `);

  await sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'enum_Requests_assignment_strategy'
      ) THEN
        CREATE TYPE "enum_Requests_assignment_strategy" AS ENUM ('AUTO', 'MANUAL', 'ESCALATED');
      END IF;
    END $$;
  `);

  await sequelize.query(`
    ALTER TABLE "Requests"
    ADD COLUMN IF NOT EXISTS "assignment_strategy" "enum_Requests_assignment_strategy" NOT NULL DEFAULT 'AUTO';
  `);

  await sequelize.query(`
    ALTER TABLE "Requests"
    ADD COLUMN IF NOT EXISTS "assignment_score" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "assignment_reason" TEXT,
    ADD COLUMN IF NOT EXISTS "location_bucket" VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "parent_complaint_id" UUID,
    ADD COLUMN IF NOT EXISTS "reassignment_cooldown_until" TIMESTAMP WITH TIME ZONE;
  `);
};

const connectDB = async () => {
  try {
    // Load models with associations first
    require("../models");

    await sequelize.authenticate();
    console.log("PostgreSQL connected successfully");

    await ensureDispatchSchema();
    console.log("Dispatch/load-balancing schema ensured");

    // Sync all models with the database
    // Using alter: false for safety (use resetDB script if schema changes needed)
    await sequelize.sync({ alter: false });
    console.log("Database models synced successfully");

    // Seed default services if empty
    const { Service } = require("../models");
    const count = await Service.count();
    if (count === 0) {
      await Service.bulkCreate([
        { name: "Water Supply", category: "WATER", unit_type: "tanks" },
        { name: "Parking Slots", category: "PARKING", unit_type: "slots" },
        { name: "Fuel Delivery", category: "FUEL", unit_type: "liters" },
        { name: "Medical Supplies", category: "MEDICAL", unit_type: "kits" },
        { name: "Food Supplies", category: "FOOD", unit_type: "packs" },
        { name: "Equipment", category: "EQUIPMENT", unit_type: "units" },
      ]);
      console.log("Seeded default services");
    }
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
};

module.exports = connectDB;
