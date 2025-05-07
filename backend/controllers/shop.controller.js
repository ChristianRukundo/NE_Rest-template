const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { generateTransactionHash } = require("../utils/blockchain");

// Buy item
exports.buyItem = async (req, res) => {
  try {
    const { item_id, quantity } = req.body;
    const user_id = req.user.user_id;

    // Validate input
    if (!item_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Item ID and quantity are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Check if item exists
      const item = await prisma.inventoryItem.findUnique({
        where: { id: Number.parseInt(item_id) },
      });

      if (!item) {
        throw new Error("Item not found");
      }

      // Check if there's enough stock
      if (item.current_stock < quantity) {
        throw new Error("Insufficient stock");
      }

      // Update item stock
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: Number.parseInt(item_id) },
        data: {
          current_stock: item.current_stock - quantity,
        },
      });

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          item_id: Number.parseInt(item_id),
          transaction_type: "sale",
          quantity: Number.parseInt(quantity),
          user_id: user_id,
          notes: "Online Sale",
        },
      });

      return { transaction, updatedItem };
    });

    // Generate blockchain hash for the transaction
    try {
      const blockchainHash = generateTransactionHash(result.transaction);

      // Update the transaction with the blockchain hash
      await prisma.transaction.update({
        where: { id: result.transaction.id },
        data: { blockchain_tx_hash: blockchainHash },
      });

      // Add the blockchain hash to the result
      result.transaction.blockchain_tx_hash = blockchainHash;
    } catch (blockchainError) {
      console.error("Error generating blockchain hash:", blockchainError);
      // Continue without blockchain hash - we don't want to fail the transaction
    }

    res.status(200).json({
      success: true,
      message: "Purchase successful",
      data: {
        transaction: result.transaction,
        item: result.updatedItem,
      },
    });
  } catch (error) {
    console.error("Error buying item:", error);
    res.status(error.message === "Insufficient stock" ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to complete purchase",
    });
  }
};
