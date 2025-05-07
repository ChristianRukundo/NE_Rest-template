const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all items
exports.getAllItems = async (req, res) => {
  try {
    const { search, sortBy, order, page = 1, limit = 10 } = req.query;

    // Parse pagination parameters
    const pageNum = Number.parseInt(page);
    const limitNum = Number.parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort options
    let orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = order === "desc" ? "desc" : "asc";
    } else {
      orderBy = { created_at: "desc" };
    }

    // Build filter conditions
    let where = {};
    if (search) {
      where = {
        OR: [
          { item_name: { contains: search, mode: "insensitive" } },
          { SKU: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.inventoryItem.count({ where });

    // Get items with pagination
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
    });

    res.status(200).json({
      data: items,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error getting items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get items",
      error: error.message,
    });
  }
};

// Get item by ID
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id: Number.parseInt(id) },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("Error getting item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get item",
      error: error.message,
    });
  }
};

// Create new item
exports.createItem = async (req, res) => {
  try {
    const {
      item_name,
      description,
      SKU,
      unit_price,
      sale_price,
      current_stock,
      reorder_point,
      image_url,
    } = req.body;

    // Check if SKU already exists
    const existingSKU = await prisma.inventoryItem.findUnique({
      where: { SKU },
    });

    if (existingSKU) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }

    const newItem = await prisma.inventoryItem.create({
      data: {
        item_name,
        description,
        SKU,
        unit_price: Number.parseFloat(unit_price),
        sale_price: Number.parseFloat(sale_price),
        current_stock: Number.parseInt(current_stock) || 0,
        reorder_point: reorder_point ? Number.parseInt(reorder_point) : null,
        image_url,
      },
    });

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: newItem,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create item",
      error: error.message,
    });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      item_name,
      description,
      SKU,
      unit_price,
      sale_price,
      current_stock,
      reorder_point,
      image_url,
    } = req.body;

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: Number.parseInt(id) },
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Check if SKU already exists (if changing SKU)
    if (SKU !== existingItem.SKU) {
      const existingSKU = await prisma.inventoryItem.findUnique({
        where: { SKU },
      });

      if (existingSKU) {
        return res.status(400).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: Number.parseInt(id) },
      data: {
        item_name,
        description,
        SKU,
        unit_price: Number.parseFloat(unit_price),
        sale_price: Number.parseFloat(sale_price),
        current_stock: Number.parseInt(current_stock),
        reorder_point: reorder_point ? Number.parseInt(reorder_point) : null,
        image_url,
      },
    });

    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update item",
      error: error.message,
    });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: Number.parseInt(id) },
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Check if item has transactions
    const transactions = await prisma.transaction.findMany({
      where: { item_id: Number.parseInt(id) },
    });

    if (transactions.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete item with existing transactions",
      });
    }

    await prisma.inventoryItem.delete({
      where: { id: Number.parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete item",
      error: error.message,
    });
  }
};
