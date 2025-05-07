const express = require("express")
const router = express.Router()
const shopController = require("../controllers/shop.controller")
const { verifyToken, hasPermission } = require("../middleware/auth")

// Buy item
router.post("/buy", verifyToken, hasPermission("create_sale_transaction"), shopController.buyItem)

module.exports = router
