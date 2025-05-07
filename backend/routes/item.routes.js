const express = require("express")
const router = express.Router()
const itemController = require("../controllers/item.controller")
const { verifyToken, hasPermission, hasAnyPermission } = require("../middleware/auth")

// Get all items
router.get("/", verifyToken, hasAnyPermission(["read_item", "read_item_for_sale"]), itemController.getAllItems)

// Get item by ID
router.get("/:id", verifyToken, hasAnyPermission(["read_item", "read_item_for_sale"]), itemController.getItemById)

// Create new item
router.post("/", verifyToken, hasPermission("create_item"), itemController.createItem)

// Update item
router.put("/:id", verifyToken, hasPermission("update_item"), itemController.updateItem)

// Delete item
router.delete("/:id", verifyToken, hasPermission("delete_item"), itemController.deleteItem)

module.exports = router
