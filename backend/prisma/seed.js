const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Clear existing data
  await prisma.transaction.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  console.log("Existing data cleared");

  // Create roles
  const rolesResult = await prisma.role.createMany({
    data: [
      { name: "Admin", description: "Administrator with full access" },
      {
        name: "Manager",
        description: "Manager with limited administrative access",
      },
      { name: "Viewer", description: "User with view-only access" },
      { name: "Buyer", description: "User who can purchase items" },
    ],
    skipDuplicates: true,
  });

  console.log("Roles created:", rolesResult);

  // Get role IDs
  const adminRole = await prisma.role.findUnique({ where: { name: "Admin" } });
  const managerRole = await prisma.role.findUnique({
    where: { name: "Manager" },
  });
  const viewerRole = await prisma.role.findUnique({
    where: { name: "Viewer" },
  });
  const buyerRole = await prisma.role.findUnique({ where: { name: "Buyer" } });

  // Create permissions
  const permissions = await prisma.permission.createMany({
    data: [
      { name: "manage_users", description: "Can manage users" },
      { name: "assign_roles", description: "Can assign roles to users" },
      { name: "create_item", description: "Can create inventory items" },
      { name: "update_item", description: "Can update inventory items" },
      { name: "delete_item", description: "Can delete inventory items" },
      { name: "read_item", description: "Can view inventory items" },
      { name: "read_item_for_sale", description: "Can view items for sale" },
      { name: "create_sale_transaction", description: "Can purchase items" },
      {
        name: "create_transaction",
        description: "Can create inventory transactions",
      },
      { name: "read_transactions", description: "Can view all transactions" },
      {
        name: "read_own_transactions",
        description: "Can view own transactions",
      },
      { name: "view_reports", description: "Can view reports" },
      { name: "export_reports", description: "Can export reports" },
      {
        name: "verify_blockchain",
        description: "Can verify blockchain transactions",
      },
      { name: "upload_image", description: "Can upload images" },
    ],
    skipDuplicates: true,
  });

  console.log("Permissions created:", permissions);

  // Assign permissions to roles
  const rolePermissions = [];

  // Admin has all permissions
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    rolePermissions.push({
      role_id: adminRole.id,
      permission_id: permission.id,
    });
  }

  // Manager permissions
  const managerPermissions = [
    "create_item",
    "update_item",
    "read_item",
    "read_item_for_sale",
    "create_transaction",
    "read_transactions",
    "read_own_transactions",
    "view_reports",
    "export_reports",
    "verify_blockchain",
    "upload_image",
  ];
  for (const permName of managerPermissions) {
    const permission = await prisma.permission.findUnique({
      where: { name: permName },
    });
    if (permission) {
      rolePermissions.push({
        role_id: managerRole.id,
        permission_id: permission.id,
      });
    }
  }

  // Viewer permissions
  const viewerPermissions = [
    "read_item",
    "read_item_for_sale",
    "read_own_transactions",
  ];
  for (const permName of viewerPermissions) {
    const permission = await prisma.permission.findUnique({
      where: { name: permName },
    });
    if (permission) {
      rolePermissions.push({
        role_id: viewerRole.id,
        permission_id: permission.id,
      });
    }
  }

  // Buyer permissions
  const buyerPermissions = [
    "read_item_for_sale",
    "create_sale_transaction",
    "read_own_transactions",
  ];
  for (const permName of buyerPermissions) {
    const permission = await prisma.permission.findUnique({
      where: { name: permName },
    });
    if (permission) {
      rolePermissions.push({
        role_id: buyerRole.id,
        permission_id: permission.id,
      });
    }
  }

  await prisma.rolePermission.createMany({
    data: rolePermissions,
    skipDuplicates: true,
  });

  console.log("Role permissions assigned");

  // Create users
  const saltRounds = 10;
  const defaultPassword = await bcrypt.hash("password123", saltRounds);

  const users = [];

  // Create admin user
  users.push({
    username: "admin",
    email: "admin@example.com",
    password: defaultPassword,
    first_name: "Admin",
    last_name: "User",
    role_id: adminRole.id,
    email_verified: true,
  });

  // Create manager user
  users.push({
    username: "manager",
    email: "manager@example.com",
    password: defaultPassword,
    first_name: "Manager",
    last_name: "User",
    role_id: managerRole.id,
    email_verified: true,
  });

  // Create buyer user
  users.push({
    username: "buyer",
    email: "buyer@example.com",
    password: defaultPassword,
    first_name: "Buyer",
    last_name: "User",
    role_id: buyerRole.id,
    email_verified: true,
  });

  // Create viewer user
  users.push({
    username: "viewer",
    email: "viewer@example.com",
    password: defaultPassword,
    first_name: "Viewer",
    last_name: "User",
    role_id: viewerRole.id,
    email_verified: true,
  });

  // Create 20 random users with different roles
  const roleIds = [viewerRole.id, buyerRole.id];
  const firstNames = [
    "John",
    "Jane",
    "Michael",
    "Emily",
    "David",
    "Sarah",
    "Robert",
    "Lisa",
    "William",
    "Emma",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Jones",
    "Brown",
    "Davis",
    "Miller",
    "Wilson",
    "Moore",
    "Taylor",
  ];

  for (let i = 1; i <= 20; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const roleId = roleIds[Math.floor(Math.random() * roleIds.length)];

    users.push({
      username: `user${i}`,
      email: `user${i}@example.com`,
      password: defaultPassword,
      first_name: firstName,
      last_name: lastName,
      role_id: roleId,
      email_verified: true,
    });
  }

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log("Users created:", users.length);

  // Create inventory items
  const items = [];
  const categories = [
    "Electronics",
    "Clothing",
    "Home Goods",
    "Office Supplies",
    "Food",
    "Toys",
  ];
  const adjectives = [
    "Premium",
    "Deluxe",
    "Basic",
    "Advanced",
    "Professional",
    "Standard",
    "Luxury",
    "Economy",
  ];

  for (let i = 1; i <= 50; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const itemName = `${adjective} ${category} Item ${i}`;
    const unitPrice = Number.parseFloat((Math.random() * 100 + 10).toFixed(2));
    const salePrice = Number.parseFloat(
      (unitPrice * (1 + Math.random() * 0.5)).toFixed(2)
    );
    const reorderPoint = Math.floor(Math.random() * 10) + 5;

    items.push({
      item_name: itemName,
      description: `This is a ${adjective.toLowerCase()} quality ${category.toLowerCase()} item.`,
      SKU: `${category.substring(0, 3).toUpperCase()}${i
        .toString()
        .padStart(4, "0")}`,
      unit_price: unitPrice,
      sale_price: salePrice,
      current_stock: 0, // Will be updated by transactions
      reorder_point: reorderPoint,
      image_url: null, // No images in seed data
    });
  }

  await prisma.inventoryItem.createMany({
    data: items,
    skipDuplicates: true,
  });

  console.log("Inventory items created:", items.length);

  // Create transactions
  const transactions = [];
  const transactionTypes = [
    "initial_stock",
    "adjustment_increase",
    "adjustment_decrease",
    "sale",
  ];
  const allItems = await prisma.inventoryItem.findMany();
  const allUsers = await prisma.user.findMany();

  // Get admin and buyer users for specific transaction types
  const adminUser = await prisma.user.findUnique({
    where: { username: "admin" },
  });
  const buyerUser = await prisma.user.findUnique({
    where: { username: "buyer" },
  });
  const managerUser = await prisma.user.findUnique({
    where: { username: "manager" },
  });

  // Create initial stock transactions for all items (by admin)
  for (const item of allItems) {
    const initialStock = Math.floor(Math.random() * 50) + 20;

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date in the last 30 days

    const blockchainTxHash = crypto
      .createHash("sha256")
      .update(
        `${item.id}-initial_stock-${initialStock}-${date.toISOString()}-${
          adminUser.id
        }`
      )
      .digest("hex");

    transactions.push({
      item_id: item.id,
      transaction_type: "initial_stock",
      quantity: initialStock,
      transaction_date: date,
      user_id: adminUser.id,
      notes: `Initial stock for ${item.item_name}`,
      blockchain_tx_hash: blockchainTxHash,
    });
  }

  // Create some adjustment transactions (by manager)
  for (let i = 0; i < 20; i++) {
    const item = allItems[Math.floor(Math.random() * allItems.length)];
    const type =
      Math.random() > 0.5 ? "adjustment_increase" : "adjustment_decrease";
    const quantity =
      type === "adjustment_increase"
        ? Math.floor(Math.random() * 10) + 5
        : Math.floor(Math.random() * 3) + 1;

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 20)); // Random date in the last 20 days

    const blockchainTxHash = crypto
      .createHash("sha256")
      .update(
        `${item.id}-${type}-${quantity}-${date.toISOString()}-${managerUser.id}`
      )
      .digest("hex");

    transactions.push({
      item_id: item.id,
      transaction_type: type,
      quantity: quantity,
      transaction_date: date,
      user_id: managerUser.id,
      notes: `${
        type === "adjustment_increase" ? "Increased" : "Decreased"
      } stock for ${item.item_name}`,
      blockchain_tx_hash: blockchainTxHash,
    });
  }

  // Create some sale transactions (by buyer)
  for (let i = 0; i < 15; i++) {
    const item = allItems[Math.floor(Math.random() * allItems.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 15)); // Random date in the last 15 days

    const blockchainTxHash = crypto
      .createHash("sha256")
      .update(
        `${item.id}-sale-${quantity}-${date.toISOString()}-${buyerUser.id}`
      )
      .digest("hex");

    transactions.push({
      item_id: item.id,
      transaction_type: "sale",
      quantity: quantity,
      transaction_date: date,
      user_id: buyerUser.id,
      notes: `Purchase of ${item.item_name}`,
      blockchain_tx_hash: blockchainTxHash,
    });
  }

  // Create some more sale transactions for random users
  const buyerUsers = allUsers.filter((user) => user.role_id === buyerRole.id);

  for (let i = 0; i < 30; i++) {
    const item = allItems[Math.floor(Math.random() * allItems.length)];
    const user = buyerUsers[Math.floor(Math.random() * buyerUsers.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 10)); // Random date in the last 10 days

    const blockchainTxHash = crypto
      .createHash("sha256")
      .update(`${item.id}-sale-${quantity}-${date.toISOString()}-${user.id}`)
      .digest("hex");

    transactions.push({
      item_id: item.id,
      transaction_type: "sale",
      quantity: quantity,
      transaction_date: date,
      user_id: user.id,
      notes: `Purchase of ${item.item_name}`,
      blockchain_tx_hash: blockchainTxHash,
    });
  }

  await prisma.transaction.createMany({
    data: transactions,
    skipDuplicates: true,
  });

  console.log("Transactions created:", transactions.length);

  // Update current stock based on transactions
  for (const item of allItems) {
    const itemTransactions = await prisma.transaction.findMany({
      where: { item_id: item.id },
    });

    let currentStock = 0;

    for (const t of itemTransactions) {
      if (
        t.transaction_type === "initial_stock" ||
        t.transaction_type === "adjustment_increase"
      ) {
        currentStock += t.quantity;
      } else if (
        t.transaction_type === "adjustment_decrease" ||
        t.transaction_type === "sale"
      ) {
        currentStock -= t.quantity;
      }
    }

    // Ensure stock doesn't go negative
    currentStock = Math.max(0, currentStock);

    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { current_stock: currentStock },
    });
  }

  console.log("Current stock updated for all items");
  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
