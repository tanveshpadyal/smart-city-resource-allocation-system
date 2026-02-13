/**
 * User Model
 * Represents system users with role-based access control
 */

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 255],
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          len: [5, 255],
        },
      },
      password_hash: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [60, 255], // bcrypt hashes are exactly 60 characters
        },
      },
      role: {
        type: DataTypes.ENUM("ADMIN", "OPERATOR", "CITIZEN"),
        defaultValue: "CITIZEN",
        allowNull: false,
      },
      auth_provider: {
        type: DataTypes.ENUM("local", "google"),
        allowNull: false,
        defaultValue: "local",
      },
      google_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM("active", "suspended"),
        defaultValue: "active",
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Operator availability for auto-assignment",
      },
      assignedAreas: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
        comment: "Areas this operator is responsible for",
      },
      profile_photo: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Base64/profile image URL for user avatar",
      },
      reset_password_token_hash: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reset_password_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      // Enable timestamps (createdAt, updatedAt)
      timestamps: true,
      // Disable soft delete by default
      paranoid: false,
    },
  );

  // Optional: Add hooks for logging or other custom logic
  User.addHook("afterCreate", (user) => {
    console.log(`User created: ${user.email} with role ${user.role}`);
  });

  return User;
};
