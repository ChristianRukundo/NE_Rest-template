/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the transaction
 *         item_id:
 *           type: integer
 *           description: The ID of the item
 *         transaction_type:
 *           type: string
 *           enum: [sale, initial_stock, adjustment_increase, adjustment_decrease]
 *           description: The type of transaction
 *         quantity:
 *           type: integer
 *           description: The quantity of the transaction
 *         transaction_date:
 *           type: string
 *           format: date-time
 *           description: The date of the transaction
 *         user_id:
 *           type: integer
 *           description: The ID of the user who recorded the transaction
 *         notes:
 *           type: string
 *           description: Additional notes for the transaction
 *         blockchain_tx_hash:
 *           type: string
 *           description: The blockchain transaction hash for verification
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The date the transaction was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: The date the transaction was last updated
 *
 *     TransactionRequest:
 *       type: object
 *       required:
 *         - item_id
 *         - transaction_type
 *         - quantity
 *       properties:
 *         item_id:
 *           type: integer
 *           description: The ID of the item
 *         transaction_type:
 *           type: string
 *           enum: [initial_stock, adjustment_increase, adjustment_decrease]
 *           description: The type of transaction
 *         quantity:
 *           type: integer
 *           description: The quantity of the transaction
 *         notes:
 *           type: string
 *           description: Additional notes for the transaction
 *         transaction_date:
 *           type: string
 *           format: date-time
 *           description: The date of the transaction (optional, defaults to current date/time)
 *
 *     BlockchainVerification:
 *       type: object
 *       properties:
 *         transaction_id:
 *           type: integer
 *           description: The ID of the transaction
 *         blockchain_tx_hash:
 *           type: string
 *           description: The blockchain transaction hash
 *         is_valid:
 *           type: boolean
 *           description: Whether the blockchain transaction is valid
 *         block_explorer_url:
 *           type: string
 *           description: URL to view the transaction on a blockchain explorer
 */

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for item name or SKU
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sale, initial_stock, adjustment_increase, adjustment_decrease]
 *         description: Filter by transaction type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
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
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new transaction (non-sale types) with blockchain recording
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionRequest'
 *     responses:
 *       201:
 *         description: Transaction created successfully and recorded on blockchain
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *                     item:
 *                       type: object
 *       400:
 *         description: Invalid input or insufficient stock
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/transactions/{id}/verify-blockchain:
 *   get:
 *     summary: Verify blockchain transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Blockchain verification details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlockchainVerification'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transaction not found or no blockchain record
 *       500:
 *         description: Server error
 */
