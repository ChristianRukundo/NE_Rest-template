const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
const { generateTransactionHash, verifyTransactionHash, getBlockExplorerUrl } = require("../utils/blockchain")

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const { search, type, startDate, endDate, sortBy, order, page = 1, limit = 10 } = req.query

    // Parse pagination parameters
    const pageNum = Number.parseInt(page)
    const limitNum = Number.parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Build sort options
    let orderBy = {}
    if (sortBy) {
      orderBy[sortBy] = order === "desc" ? "desc" : "asc"
    } else {
      orderBy = { transaction_date: "desc" }
    }

    // Build filter conditions
    const where = {}

    // Filter by transaction type
    if (type) {
      where.transaction_type = type
    }

    // Filter by date range
    if (startDate || endDate) {
      where.transaction_date = {}
      if (startDate) {
        where.transaction_date.gte = new Date(startDate)
      }
      if (endDate) {
        where.transaction_date.lte = new Date(endDate)
      }
    }

    // Search by item name or SKU
    if (search) {
      where.item = {
        OR: [
          { item_name: { contains: search, mode: "insensitive" } },
          { SKU: { contains: search, mode: "insensitive" } },
        ],
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({ where })

    // Get transactions with pagination
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        item: true,
        recorded_by: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    res.status(200).json({
      data: transactions,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    })
  } catch (error) {
    console.error("Error getting transactions:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get transactions",
      error: error.message,
    })
  }
}

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params

    const transaction = await prisma.transaction.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        item: true,
        recorded_by: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      })
    }

    res.status(200).json(transaction)
  } catch (error) {
    console.error("Error getting transaction:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get transaction",
      error: error.message,
    })
  }
}

// Create new transaction (non-sale types)
exports.createTransaction = async (req, res) => {
  try {
    const { item_id, transaction_type, quantity, notes, transaction_date } = req.body

    const user_id = req.user.user_id

    // Validate input
    if (!item_id || !transaction_type || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Item ID, transaction type, and quantity are required",
      })
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      })
    }

    // Validate transaction type
    const validTypes = ["initial_stock", "adjustment_increase", "adjustment_decrease"]
    if (!validTypes.includes(transaction_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type. Must be one of: " + validTypes.join(", "),
      })
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Check if item exists
      const item = await prisma.inventoryItem.findUnique({
        where: { id: Number.parseInt(item_id) },
      })

      if (!item) {
        throw new Error("Item not found")
      }

      // Calculate new stock based on transaction type
      let newStock = item.current_stock

      if (transaction_type === "initial_stock" || transaction_type === "adjustment_increase") {
        newStock += Number.parseInt(quantity)
      } else if (transaction_type === "adjustment_decrease") {
        // Check if there's enough stock for decrease
        if (item.current_stock < quantity) {
          throw new Error("Insufficient stock for adjustment")
        }
        newStock -= Number.parseInt(quantity)
      }

      // Update item stock
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: Number.parseInt(item_id) },
        data: {
          current_stock: newStock,
        },
      })

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          item_id: Number.parseInt(item_id),
          transaction_type,
          quantity: Number.parseInt(quantity),
          user_id,
          notes: notes || null,
          transaction_date: transaction_date ? new Date(transaction_date) : new Date(),
        },
      })

      return { transaction, updatedItem }
    })

    // Generate blockchain hash for the transaction
    try {
      const blockchainHash = generateTransactionHash(result.transaction)

      // Update the transaction with the blockchain hash
      await prisma.transaction.update({
        where: { id: result.transaction.id },
        data: { blockchain_tx_hash: blockchainHash },
      })

      // Add the blockchain hash to the result
      result.transaction.blockchain_tx_hash = blockchainHash
    } catch (blockchainError) {
      console.error("Error generating blockchain hash:", blockchainError)
      // Continue without blockchain hash - we don't want to fail the transaction
    }

    res.status(201).json({
      success: true,
      message: "Transaction recorded successfully",
      data: {
        transaction: result.transaction,
        item: result.updatedItem,
      },
    })
  } catch (error) {
    console.error("Error creating transaction:", error)
    res.status(error.message.includes("Insufficient stock") ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to record transaction",
    })
  }
}

// Verify blockchain transaction
exports.verifyBlockchainTransaction = async (req, res) => {
  try {
    const { id } = req.params

    const transaction = await prisma.transaction.findUnique({
      where: { id: Number.parseInt(id) },
    })

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      })
    }

    if (!transaction.blockchain_tx_hash) {
      return res.status(404).json({
        success: false,
        message: "No blockchain record found for this transaction",
      })
    }

    // Verify the transaction hash
    const isValid = verifyTransactionHash(transaction, transaction.blockchain_tx_hash)

    // Get block explorer URL
    const blockExplorerUrl = getBlockExplorerUrl(transaction.blockchain_tx_hash)

    res.status(200).json({
      success: true,
      data: {
        transaction_id: transaction.id,
        blockchain_tx_hash: transaction.blockchain_tx_hash,
        is_valid: isValid,
        block_explorer_url: blockExplorerUrl,
      },
    })
  } catch (error) {
    console.error("Error verifying blockchain transaction:", error)
    res.status(500).json({
      success: false,
      message: "Failed to verify blockchain transaction",
      error: error.message,
    })
  }
}
