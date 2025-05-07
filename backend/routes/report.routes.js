const express = require("express")
const router = express.Router()
const reportController = require("../controllers/report.controller")
const { verifyToken, hasAnyPermission } = require("../middleware/auth")

// Get inventory summary report
router.get(
  "/inventory-summary",
  verifyToken,
  hasAnyPermission(["read_reports", "Admin"]),
  reportController.getInventorySummary,
)

// Get transactions report
router.get(
  "/transactions",
  verifyToken,
  hasAnyPermission(["read_reports", "Admin"]),
  reportController.getTransactionsReport,
)

// Generate inventory summary document (HTML)
router.get(
  "/inventory-summary/document",
  verifyToken,
  hasAnyPermission(["read_reports", "Admin"]),
  reportController.generateInventorySummaryDocument,
)

// Generate inventory summary CSV
router.get(
  "/inventory-summary/csv",
  verifyToken,
  hasAnyPermission(["read_reports", "Admin"]),
  reportController.generateInventorySummaryCSV,
)

module.exports = router
