/**
 * @swagger
 * components:
 *   schemas:
 *     BuyRequest:
 *       type: object
 *       required:
 *         - item_id
 *         - quantity
 *       properties:
 *         item_id:
 *           type: integer
 *           description: The ID of the item to buy
 *         quantity:
 *           type: integer
 *           description: The quantity to buy
 *
 *     BuyResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the purchase was successful
 *         message:
 *           type: string
 *           description: A message describing the result
 *         data:
 *           type: object
 *           properties:
 *             transaction:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the transaction
 *                 item_id:
 *                   type: integer
 *                   description: The ID of the item
 *                 transaction_type:
 *                   type: string
 *                   description: The type of transaction (sale)
 *                 quantity:
 *                   type: integer
 *                   description: The quantity purchased
 *                 user_id:
 *                   type: integer
 *                   description: The ID of the user who made the purchase
 *                 notes:
 *                   type: string
 *                   description: Additional notes for the transaction
 *                 blockchain_tx_hash:
 *                   type: string
 *                   description: The blockchain transaction hash for verification
 *             item:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the item
 *                 current_stock:
 *                   type: integer
 *                   description: The updated stock level
 */

/**
 * @swagger
 * tags:
 *   name: Shop
 *   description: Shop operations
 */

/**
 * @swagger
 * /api/shop/buy:
 *   post:
 *     summary: Buy an item with blockchain recording
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BuyRequest'
 *     responses:
 *       200:
 *         description: Purchase successful and recorded on blockchain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BuyResponse'
 *       400:
 *         description: Invalid input or insufficient stock
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
