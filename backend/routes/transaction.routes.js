const express = require("express")
const router = express.Router()
const transactionController = require("../controllers/transaction.controller")
const { verifyToken, hasPermission } = require("../middleware/auth")

// Get all transactions
router.get("/", verifyToken, hasPermission("read_transactions"), transactionController.getAllTransactions)

// Get transaction by ID
router.get("/:id", verifyToken, hasPermission("read_transactions"), transactionController.getTransactionById)

// Create new transaction (non-sale types)
router.post("/", verifyToken, hasPermission("create_transaction"), transactionController.createTransaction)

// Verify blockchain transaction
router.get(
  "/:id/verify-blockchain",
  verifyToken,
  hasPermission("read_transactions"),
  transactionController.verifyBlockchainTransaction,
)

module.exports = router
