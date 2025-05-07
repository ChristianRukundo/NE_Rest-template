const express = require("express")
const router = express.Router()
const uploadController = require("../controllers/upload.controller")
const { verifyToken, hasPermission } = require("../middleware/auth")
const upload = require("../middleware/upload")

// Upload image
router.post("/images", verifyToken, hasPermission("upload_image"), upload.single("image"), uploadController.uploadImage)

module.exports = router
