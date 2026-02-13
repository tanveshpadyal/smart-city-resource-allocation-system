/**
 * Provider & Service Routes
 */

const express = require("express");
const router = express.Router();

const { authenticateToken, authorize } = require("../middleware/auth");
const providerController = require("../controllers/providers");

// Public: list services for citizens
router.get("/services", providerController.listProviderServices);
router.get("/catalog", providerController.listServicesCatalog);

// Operator: provider profile
router.post(
  "/me",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  providerController.createProvider,
);
router.get(
  "/me",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  providerController.getMyProvider,
);
router.put(
  "/me",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  providerController.updateMyProvider,
);

// Operator: add service offering
router.post(
  "/me/services",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  providerController.addProviderService,
);

module.exports = router;
