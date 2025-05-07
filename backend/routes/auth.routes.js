const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middleware/auth");

// Public routes
router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Protected routes
router.get("/me", authenticateToken, authController.getCurrentUser);
router.put("/me", authenticateToken, authController.updateProfile);

module.exports = router;
