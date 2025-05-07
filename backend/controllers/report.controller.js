const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");

// Get inventory summary report
exports.getInventorySummary = async (req, res) => {
  try {
    const { search, sortBy, order, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = order === "desc" ? "desc" : "asc";
    } else {
      orderBy = { item_name: "asc" };
    }

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

    // Get paginated items
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
    });

    // Calculate total value for each item
    const inventorySummary = items.map((item) => {
      const totalValue =
        Number.parseFloat(item.unit_price) * item.current_stock;
      const totalSaleValue =
        Number.parseFloat(item.sale_price) * item.current_stock;

      return {
        ...item,
        total_value: totalValue,
        total_sale_value: totalSaleValue,
        potential_profit: totalSaleValue - totalValue,
      };
    });

    // Get all items for calculating totals (no pagination)
    const allItems = await prisma.inventoryItem.findMany({ where });
    const totals = allItems.reduce(
      (acc, item) => {
        const itemTotalValue =
          Number.parseFloat(item.unit_price) * item.current_stock;
        const itemTotalSaleValue =
          Number.parseFloat(item.sale_price) * item.current_stock;

        return {
          totalItems: acc.totalItems + 1,
          totalStock: acc.totalStock + item.current_stock,
          totalValue: acc.totalValue + itemTotalValue,
          totalSaleValue: acc.totalSaleValue + itemTotalSaleValue,
          totalPotentialProfit:
            acc.totalPotentialProfit + (itemTotalSaleValue - itemTotalValue),
        };
      },
      {
        totalItems: 0,
        totalStock: 0,
        totalValue: 0,
        totalSaleValue: 0,
        totalPotentialProfit: 0,
      }
    );

    res.status(200).json({
      data: inventorySummary,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      totals,
    });
  } catch (error) {
    console.error("Error getting inventory summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get inventory summary",
      error: error.message,
    });
  }
};

// Get transactions report
exports.getTransactionsReport = async (req, res) => {
  try {
    const {
      search,
      type,
      startDate,
      endDate,
      sortBy,
      order,
      page = 1,
      limit = 10,
    } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = order === "desc" ? "desc" : "asc";
    } else {
      orderBy = { transaction_date: "desc" };
    }

    const where = {};

    // Filter by transaction type
    if (type && type !== "all") {
      where.transaction_type = type;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.transaction_date = {};
      if (startDate) {
        where.transaction_date.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day for inclusive range
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.transaction_date.lte = endDateTime;
      }
    }

    // Search filter - using item relation for searching
    if (search) {
      where.OR = [
        { notes: { contains: search, mode: "insensitive" } },
        { item: { item_name: { contains: search, mode: "insensitive" } } },
        { item: { SKU: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({ where });

    // Get paginated transactions
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
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Format transactions for report
    const transactionsReport = transactions.map((transaction) => {
      return {
        id: transaction.id,
        item_name: transaction.item.item_name,
        SKU: transaction.item.SKU,
        transaction_type: transaction.transaction_type,
        quantity: transaction.quantity,
        transaction_date: transaction.transaction_date,
        recorded_by: `${transaction.recorded_by.first_name} ${transaction.recorded_by.last_name}`,
        username: transaction.recorded_by.username,
        role: transaction.recorded_by.role.name,
        notes: transaction.notes || "",
        unit_price: Number.parseFloat(transaction.item.unit_price),
        sale_price: Number.parseFloat(transaction.item.sale_price),
        total_value:
          transaction.transaction_type === "sale"
            ? Number.parseFloat(transaction.item.sale_price) *
              transaction.quantity
            : Number.parseFloat(transaction.item.unit_price) *
              transaction.quantity,
        blockchain_tx_hash: transaction.blockchain_tx_hash,
      };
    });

    // Calculate totals (no pagination)
    const allTransactions = await prisma.transaction.count();
    const totalQuantity = await prisma.transaction.aggregate({
      _sum: { quantity: true },
      where,
    });

    // We need to calculate total value across all matching transactions
    const allMatchingTransactions = await prisma.transaction.findMany({
      where,
      include: { item: true },
    });

    const totalValue = allMatchingTransactions.reduce((sum, t) => {
      const value =
        t.transaction_type === "sale"
          ? Number.parseFloat(t.item.sale_price) * t.quantity
          : Number.parseFloat(t.item.unit_price) * t.quantity;
      return sum + value;
    }, 0);

    res.status(200).json({
      data: transactionsReport,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      totals: {
        totalTransactions: totalCount,
        totalQuantity: totalQuantity._sum.quantity || 0,
        totalValue: totalValue,
      },
    });
  } catch (error) {
    console.error("Error getting transactions report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transactions report",
      error: error.message,
    });
  }
};

// Generate inventory summary document (HTML)
exports.generateInventorySummaryDocument = async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { item_name: "asc" },
    });

    // Calculate total value for each item
    const inventorySummary = items.map((item) => {
      const totalValue =
        Number.parseFloat(item.unit_price) * item.current_stock;
      const totalSaleValue =
        Number.parseFloat(item.sale_price) * item.current_stock;

      return {
        ...item,
        total_value: totalValue,
        total_sale_value: totalSaleValue,
        potential_profit: totalSaleValue - totalValue,
      };
    });

    // Calculate totals
    const totalItems = items.length;
    const totalStock = items.reduce((sum, item) => sum + item.current_stock, 0);
    const totalValue = inventorySummary.reduce(
      (sum, item) => sum + item.total_value,
      0
    );
    const totalSaleValue = inventorySummary.reduce(
      (sum, item) => sum + item.total_sale_value,
      0
    );
    const totalPotentialProfit = totalSaleValue - totalValue;

    // Generate HTML
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Summary Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .summary { margin-top: 20px; font-weight: bold; }
          .date { margin-bottom: 20px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Inventory Summary Report</h1>
        <div class="date">Generated on: ${new Date().toLocaleString()}</div>
        
        <table>
          <tr>
            <th>SKU</th>
            <th>Item Name</th>
            <th>Current Stock</th>
            <th>Unit Price</th>
            <th>Sale Price</th>
            <th>Total Value</th>
            <th>Total Sale Value</th>
            <th>Potential Profit</th>
          </tr>
    `;

    inventorySummary.forEach((item) => {
      html += `
        <tr>
          <td>${item.SKU}</td>
          <td>${item.item_name}</td>
          <td>${item.current_stock}</td>
          <td>$${Number.parseFloat(item.unit_price).toFixed(2)}</td>
          <td>$${Number.parseFloat(item.sale_price).toFixed(2)}</td>
          <td>$${item.total_value.toFixed(2)}</td>
          <td>$${item.total_sale_value.toFixed(2)}</td>
          <td>$${item.potential_profit.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
        </table>
        
        <div class="summary">
          <p>Total Items: ${totalItems}</p>
          <p>Total Stock: ${totalStock} units</p>
          <p>Total Inventory Value: $${totalValue.toFixed(2)}</p>
          <p>Total Sale Value: $${totalSaleValue.toFixed(2)}</p>
          <p>Total Potential Profit: $${totalPotentialProfit.toFixed(2)}</p>
        </div>
      </body>
      </html>
    `;

    // Set headers
    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=inventory-summary.html"
    );

    // Send HTML
    res.send(html);
  } catch (error) {
    console.error("Error generating inventory summary document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate inventory summary document",
      error: error.message,
    });
  }
};

// Generate inventory summary CSV
exports.generateInventorySummaryCSV = async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { item_name: "asc" },
    });

    // Calculate total value for each item
    const inventorySummary = items.map((item) => {
      const totalValue =
        Number.parseFloat(item.unit_price) * item.current_stock;
      const totalSaleValue =
        Number.parseFloat(item.sale_price) * item.current_stock;

      return {
        SKU: item.SKU,
        item_name: item.item_name,
        description: item.description || "",
        current_stock: item.current_stock,
        reorder_point: item.reorder_point || "",
        unit_price: Number.parseFloat(item.unit_price).toFixed(2),
        sale_price: Number.parseFloat(item.sale_price).toFixed(2),
        total_value: totalValue.toFixed(2),
        total_sale_value: totalSaleValue.toFixed(2),
        potential_profit: (totalSaleValue - totalValue).toFixed(2),
        image_url: item.image_url || "",
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString(),
      };
    });

    // Define fields for CSV
    const fields = [
      "SKU",
      "item_name",
      "description",
      "current_stock",
      "reorder_point",
      "unit_price",
      "sale_price",
      "total_value",
      "total_sale_value",
      "potential_profit",
      "image_url",
      "created_at",
      "updated_at",
    ];

    // Create CSV parser
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(inventorySummary);

    // Set headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=inventory-summary.csv"
    );

    // Send CSV
    res.send(csv);
  } catch (error) {
    console.error("Error generating inventory summary CSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate inventory summary CSV",
      error: error.message,
    });
  }
};
