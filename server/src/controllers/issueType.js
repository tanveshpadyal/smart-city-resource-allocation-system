const db = require("../models");
const { Op } = require("sequelize");

const COMPLAINT_CATEGORIES = ["ROAD", "GARBAGE", "WATER", "LIGHT", "OTHER"];

const buildSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const serializeIssueType = (issueType) => ({
  id: issueType.id,
  name: issueType.name,
  slug: issueType.slug,
  category: issueType.category,
  description: issueType.description,
  is_active: Boolean(issueType.is_active),
  createdAt: issueType.createdAt,
  updatedAt: issueType.updatedAt,
});

const getActiveIssueTypes = async (req, res) => {
  try {
    const issueTypes = await db.IssueType.findAll({
      where: { is_active: true },
      order: [
        ["category", "ASC"],
        ["name", "ASC"],
      ],
    });

    return res.status(200).json({
      success: true,
      data: issueTypes.map(serializeIssueType),
    });
  } catch (error) {
    console.error("Error in getActiveIssueTypes:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch issue types",
      code: "ISSUE_TYPES_FETCH_ERROR",
    });
  }
};

const getAdminIssueTypes = async (req, res) => {
  try {
    const issueTypes = await db.IssueType.findAll({
      order: [
        ["is_active", "DESC"],
        ["category", "ASC"],
        ["name", "ASC"],
      ],
    });

    return res.status(200).json({
      success: true,
      data: issueTypes.map(serializeIssueType),
    });
  } catch (error) {
    console.error("Error in getAdminIssueTypes:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch admin issue types",
      code: "ADMIN_ISSUE_TYPES_FETCH_ERROR",
    });
  }
};

const createIssueType = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const normalizedName =
      typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const normalizedCategoryInput =
      typeof req.body?.category === "string"
        ? req.body.category.trim().toUpperCase()
        : "";
    const normalizedCategory = COMPLAINT_CATEGORIES.includes(
      normalizedCategoryInput,
    )
      ? normalizedCategoryInput
      : "OTHER";
    const normalizedDescription =
      typeof req.body?.description === "string"
        ? req.body.description.trim()
        : "";

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        error: "Issue name is required",
        code: "ISSUE_NAME_REQUIRED",
      });
    }

    const slug = buildSlug(normalizedName);
    if (!slug) {
      return res.status(400).json({
        success: false,
        error: "Issue name must include valid characters",
        code: "INVALID_ISSUE_NAME",
      });
    }

    const existing = await db.IssueType.findOne({
      where: {
        [Op.or]: [
          { slug },
          { name: { [Op.iLike]: normalizedName } },
        ],
      },
    });

    if (existing) {
      existing.name = normalizedName;
      existing.slug = slug;
      existing.category = normalizedCategory;
      existing.description = normalizedDescription || null;

      if (existing.is_active) {
        return res.status(409).json({
          success: false,
          error: "Issue type already exists",
          code: "ISSUE_TYPE_EXISTS",
        });
      }

      existing.is_active = true;
      await existing.save();

      await db.AdminActivityLog.create({
        admin_id: adminId,
        action_type: "RESTORE",
        entity_type: "IssueType",
        entity_id: existing.id,
        metadata: {
          name: existing.name,
          category: existing.category,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Issue type restored successfully",
        data: serializeIssueType(existing),
      });
    }

    const issueType = await db.IssueType.create({
      name: normalizedName,
      slug,
      category: normalizedCategory,
      description: normalizedDescription || null,
      is_active: true,
    });

    await db.AdminActivityLog.create({
      admin_id: adminId,
      action_type: "CREATE",
      entity_type: "IssueType",
      entity_id: issueType.id,
      metadata: {
        name: issueType.name,
        category: issueType.category,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Issue type created successfully",
      data: serializeIssueType(issueType),
    });
  } catch (error) {
    console.error("Error in createIssueType:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create issue type",
      code: "ISSUE_TYPE_CREATE_ERROR",
    });
  }
};

const deleteIssueType = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { issueTypeId } = req.params;

    const issueType = await db.IssueType.findByPk(issueTypeId);
    if (!issueType || !issueType.is_active) {
      return res.status(404).json({
        success: false,
        error: "Issue type not found",
        code: "ISSUE_TYPE_NOT_FOUND",
      });
    }

    issueType.is_active = false;
    await issueType.save();

    await db.AdminActivityLog.create({
      admin_id: adminId,
      action_type: "DEACTIVATE",
      entity_type: "IssueType",
      entity_id: issueType.id,
      metadata: {
        name: issueType.name,
        category: issueType.category,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Issue type removed successfully",
      data: serializeIssueType(issueType),
    });
  } catch (error) {
    console.error("Error in deleteIssueType:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to remove issue type",
      code: "ISSUE_TYPE_DELETE_ERROR",
    });
  }
};

module.exports = {
  getActiveIssueTypes,
  getAdminIssueTypes,
  createIssueType,
  deleteIssueType,
};
