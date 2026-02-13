/**
 * Provider Controller
 * Handles provider registration and service listings
 */

const db = require("../models");

const CITY_LIST = ["PUNE", "MUMBAI", "NAGPUR"];

const createProvider = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { name, city, description, phone, email, address, latitude, longitude } =
      req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedCity =
      typeof city === "string" ? city.trim().toUpperCase() : "";

    if (!normalizedName || !normalizedCity) {
      return res.status(400).json({
        success: false,
        error: "Name and city are required",
        code: "MISSING_FIELDS",
      });
    }

    if (!CITY_LIST.includes(normalizedCity)) {
      return res.status(400).json({
        success: false,
        error: "Invalid city",
        code: "INVALID_CITY",
      });
    }

    const existing = await db.Provider.findOne({ where: { user_id: userId } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Provider already exists for this operator",
        code: "PROVIDER_EXISTS",
      });
    }

    const provider = await db.Provider.create({
      user_id: userId,
      name: normalizedName,
      city: normalizedCity,
      description: description || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      latitude: latitude !== undefined ? Number(latitude) : null,
      longitude: longitude !== undefined ? Number(longitude) : null,
    });

    return res.status(201).json({
      success: true,
      message: "Provider created",
      data: provider,
    });
  } catch (error) {
    console.error("Error in createProvider:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create provider",
      code: "PROVIDER_CREATE_ERROR",
    });
  }
};

const getMyProvider = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const provider = await db.Provider.findOne({
      where: { user_id: userId },
      include: [
        {
          model: db.ProviderService,
          include: [{ model: db.Service }],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: provider || null,
    });
  } catch (error) {
    console.error("Error in getMyProvider:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch provider",
      code: "PROVIDER_FETCH_ERROR",
    });
  }
};

const updateMyProvider = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const provider = await db.Provider.findOne({ where: { user_id: userId } });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: "Provider not found",
        code: "PROVIDER_NOT_FOUND",
      });
    }

    const { name, city, description, phone, email, address, latitude, longitude } =
      req.body;
    const normalizedCity =
      typeof city === "string" ? city.trim().toUpperCase() : city;
    const normalizedName = typeof name === "string" ? name.trim() : name;

    if (normalizedCity && !CITY_LIST.includes(normalizedCity)) {
      return res.status(400).json({
        success: false,
        error: "Invalid city",
        code: "INVALID_CITY",
      });
    }

    await provider.update({
      name:
        normalizedName !== undefined && normalizedName !== ""
          ? normalizedName
          : provider.name,
      city: normalizedCity || provider.city,
      description: description !== undefined ? description : provider.description,
      phone: phone !== undefined ? phone : provider.phone,
      email: email !== undefined ? email : provider.email,
      address: address !== undefined ? address : provider.address,
      latitude: latitude !== undefined ? Number(latitude) : provider.latitude,
      longitude:
        longitude !== undefined ? Number(longitude) : provider.longitude,
    });

    return res.status(200).json({
      success: true,
      message: "Provider updated",
      data: provider,
    });
  } catch (error) {
    console.error("Error in updateMyProvider:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update provider",
      code: "PROVIDER_UPDATE_ERROR",
    });
  }
};

const addProviderService = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const provider = await db.Provider.findOne({ where: { user_id: userId } });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: "Provider not found",
        code: "PROVIDER_NOT_FOUND",
      });
    }

    const { serviceId, capacityTotal, capacityAvailable, pricePerUnit } =
      req.body;

    if (!serviceId || capacityTotal === undefined) {
      return res.status(400).json({
        success: false,
        error: "Service and capacity are required",
        code: "MISSING_FIELDS",
      });
    }

    const service = await db.Service.findByPk(serviceId);
    if (!service) {
      return res.status(400).json({
        success: false,
        error: "Service not found",
        code: "SERVICE_NOT_FOUND",
      });
    }

    const capTotal = Number(capacityTotal);
    const capAvail =
      capacityAvailable !== undefined
        ? Number(capacityAvailable)
        : Number(capacityTotal);

    if (Number.isNaN(capTotal) || capTotal < 0 || capAvail < 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid capacity",
        code: "INVALID_CAPACITY",
      });
    }

    const providerService = await db.ProviderService.create({
      provider_id: provider.id,
      service_id: service.id,
      capacity_total: capTotal,
      capacity_available: capAvail,
      price_per_unit:
        pricePerUnit !== undefined ? Number(pricePerUnit) : null,
    });

    return res.status(201).json({
      success: true,
      message: "Service added to provider",
      data: providerService,
    });
  } catch (error) {
    console.error("Error in addProviderService:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to add provider service",
      code: "PROVIDER_SERVICE_ERROR",
    });
  }
};

const listProviderServices = async (req, res) => {
  try {
    const { city, category, providerId } = req.query;
    const whereProvider = {};
    const whereService = {};

    if (city) {
      whereProvider.city = city;
    }

    if (category) {
      whereService.category = category;
    }

    if (providerId) {
      whereProvider.id = providerId;
    }

    const services = await db.ProviderService.findAll({
      include: [
        {
          model: db.Provider,
          where: whereProvider,
        },
        {
          model: db.Service,
          where: whereService,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Error in listProviderServices:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch services",
      code: "PROVIDER_SERVICE_LIST_ERROR",
    });
  }
};

const listServicesCatalog = async (req, res) => {
  try {
    const services = await db.Service.findAll({
      where: { is_active: true },
      order: [["name", "ASC"]],
    });
    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Error in listServicesCatalog:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch service catalog",
      code: "SERVICE_CATALOG_ERROR",
    });
  }
};

module.exports = {
  createProvider,
  getMyProvider,
  updateMyProvider,
  addProviderService,
  listProviderServices,
  listServicesCatalog,
};
