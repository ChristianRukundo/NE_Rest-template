/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: File upload management
 */

/**
 * @swagger
 * /api/uploads/images:
 *   post:
 *     summary: Upload an image
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (jpg, jpeg, png, gif)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Image uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     image_url:
 *                       type: string
 *                       example: https://res.cloudinary.com/example/image/upload/v1234567890/inventory_items/example.jpg
 *                     public_id:
 *                       type: string
 *                       example: inventory_items/example
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
