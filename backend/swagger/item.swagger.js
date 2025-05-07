/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryItem:
 *       type: object
 *       required:
 *         - item_name
 *         - SKU
 *         - unit_price
 *         - sale_price
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the item
 *         item_name:
 *           type: string
 *           description: The name of the item
 *         description:
 *           type: string
 *           description: The description of the item
 *         SKU:
 *           type: string
 *           description: The unique SKU of the item
 *         unit_price:
 *           type: number
 *           format: float
 *           description: The unit price of the item
 *         sale_price:
 *           type: number
 *           format: float
 *           description: The sale price of the item
 *         current_stock:
 *           type: integer
 *           description: The current stock of the item
 *           default: 0
 *         reorder_point:
 *           type: integer
 *           description: The reorder point of the item
 *         image_url:
 *           type: string
 *           description: The URL of the item's image
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The date the item was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: The date the item was last updated
 */

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Inventory item management
 */

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Get all items
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for item name, SKU, or description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of inventory items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryItem'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item_name
 *               - SKU
 *               - unit_price
 *               - sale_price
 *             properties:
 *               item_name:
 *                 type: string
 *               description:
 *                 type: string
 *               SKU:
 *                 type: string
 *               unit_price:
 *                 type: number
 *               sale_price:
 *                 type: number
 *               current_stock:
 *                 type: integer
 *                 default: 0
 *               reorder_point:
 *                 type: integer
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update an item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item_name:
 *                 type: string
 *               description:
 *                 type: string
 *               SKU:
 *                 type: string
 *               unit_price:
 *                 type: number
 *               sale_price:
 *                 type: number
 *               current_stock:
 *                 type: integer
 *               reorder_point:
 *                 type: integer
 *               image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete an item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       400:
 *         description: Cannot delete item with existing transactions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
