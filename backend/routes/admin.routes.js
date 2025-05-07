const express = require("express")
const router = express.Router()
const adminController = require("../controllers/admin.controller")
const { authenticateToken, checkRole, checkPermission } = require("../middleware/auth")

// All routes require authentication
router.use(authenticateToken)

// User management routes (require Admin role + manage_users permission)
router.get("/users", checkRole("Admin"), checkPermission("manage_users"), adminController.getAllUsers)
router.get("/users/:id", checkRole("Admin"), checkPermission("manage_users"), adminController.getUserById)
router.post("/users", checkRole("Admin"), checkPermission("manage_users"), adminController.createUser)
router.put("/users/:id", checkRole("Admin"), checkPermission("manage_users"), adminController.updateUser)
router.delete("/users/:id", checkRole("Admin"), checkPermission("manage_users"), adminController.deleteUser)

// Role management routes
router.get("/roles", checkRole("Admin"), adminController.getAllRoles)
router.put("/users/:id/role", checkRole("Admin"), checkPermission("assign_roles"), adminController.updateUserRole)

// Permission management routes
router.get("/permissions", checkRole("Admin"), adminController.getAllPermissions)

module.exports = router
