const sequelize = require("./database");

const connectDB = async () => {
  try {
    // Load models with associations first
    require("../models");

    await sequelize.authenticate();
    console.log("PostgreSQL connected successfully");

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
