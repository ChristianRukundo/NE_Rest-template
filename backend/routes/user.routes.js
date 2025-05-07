const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticateToken, checkPermission } = require("../middleware/auth");

// All routes require authentication
router.use(authenticateToken);

router.get("/me", userController.getUserProfile);
router.put("/me", userController.updateUserProfile);
router.get(
  "/me/transactions",
  checkPermission("read_own_transactions"),
  userController.getUserTransactions
);

module.exports = router;
