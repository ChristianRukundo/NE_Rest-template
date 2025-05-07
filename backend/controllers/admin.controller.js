const bcrypt = require("bcrypt");
const prisma = require("../config/database");
const { sendEmail } = require("../config/email");
const { generateVerificationCode } = require("../utils/helpers");

// Get all users
const getAllUsers = async (req, res) => {
  try {
    // Support filtering and sorting
    const { search, role, sortBy, order } = req.query;

    // Build filter conditions
    const where = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = {
        name: role, // Changed from role_name to name
      };
    }

    // Build sort options
    const orderBy = [];
    if (sortBy) {
      const direction = order === "desc" ? "desc" : "asc";

      switch (sortBy) {
        case "username":
          orderBy.push({ username: direction });
          break;
        case "email":
          orderBy.push({ email: direction });
          break;
        case "firstName":
          orderBy.push({ first_name: direction });
          break;
        case "lastName":
          orderBy.push({ last_name: direction });
          break;
        case "role":
          orderBy.push({ role: { name: direction } }); // Changed from role_name to name
          break;
        case "createdAt":
          orderBy.push({ created_at: direction });
          break;
        default:
          orderBy.push({ created_at: "desc" });
      }
    } else {
      orderBy.push({ created_at: "desc" });
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        role: true,
      },
      orderBy,
    });

    const sanitizedUsers = users.map((user) => ({
      id: user.id, // Changed from user_id to id
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role.name, // Changed from role_name to name
      email_verified: user.email_verified,
      created_at: user.created_at,
    }));

    res.status(200).json(sanitizedUsers);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error retrieving users" });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number.parseInt(id) }, // Changed from user_id to id
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: user.id, // Changed from user_id to id
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role.name, // Changed from role_name to name
      email_verified: user.email_verified,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Server error retrieving user" });
  }
};

// Create user
const createUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, roleName } =
      req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    // Find role
    const role = await prisma.role.findFirst({
      where: { name: roleName || "Viewer" }, // Changed from role_name to name
    });

    if (!role) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role_id: role.id, // Changed from role_id to id
        email_verification_code: verificationCode,
      },
      include: { role: true },
    });

    // Send verification email
    await sendEmail(
      email,
      "Email Verification",
      `Your verification code is: ${verificationCode}`,
      `<p>Your verification code is: <strong>${verificationCode}</strong></p>`
    );

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id, // Changed from user_id to id
        username: newUser.username,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role.name, // Changed from role_name to name
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Server error creating user" });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: Number.parseInt(id) }, // Changed from user_id to id
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {};

    if (username) {
      // Check if username is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: {
            id: Number.parseInt(id), // Changed from user_id to id
          },
        },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      updateData.username = username;
    }

    if (email) {
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: Number.parseInt(id), // Changed from user_id to id
          },
        },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      updateData.email = email;
      // If email is changed, require verification again
      updateData.email_verified = false;
      updateData.email_verification_code = generateVerificationCode();
    }

    if (firstName !== undefined) {
      updateData.first_name = firstName;
    }

    if (lastName !== undefined) {
      updateData.last_name = lastName;
    }

    if (password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: Number.parseInt(id) }, // Changed from user_id to id
      data: updateData,
      include: { role: true },
    });

    // If email was changed, send verification email
    if (email && email !== user.email) {
      await sendEmail(
        email,
        "Email Verification",
        `Your verification code is: ${updateData.email_verification_code}`,
        `<p>Your verification code is: <strong>${updateData.email_verification_code}</strong></p>`
      );
    }

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser.id, // Changed from user_id to id
        username: updatedUser.username,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        role: updatedUser.role.name, // Changed from role_name to name
        email_verified: updatedUser.email_verified,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error updating user" });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: Number.parseInt(id) }, // Changed from user_id to id
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting yourself
    if (user.id === req.user.user_id) {
      // Changed from user_id to id
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: Number.parseInt(id) }, // Changed from user_id to id
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error deleting user" });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleName } = req.body;

    if (!roleName) {
      return res.status(400).json({ message: "Role name is required" });
    }

    // Find role
    const role = await prisma.role.findFirst({
      where: { name: roleName }, // Changed from role_name to name
    });

    if (!role) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: Number.parseInt(id) }, // Changed from user_id to id
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent changing your own role
    if (user.id === req.user.user_id) {
      // Changed from user_id to id
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: Number.parseInt(id) }, // Changed from user_id to id
      data: { role_id: role.id }, // Changed from role_id to id
      include: { role: true },
    });

    res.status(200).json({
      message: "User role updated successfully",
      user: {
        id: updatedUser.id, // Changed from user_id to id
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role.name, // Changed from role_name to name
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ message: "Server error updating user role" });
  }
};

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    res.status(200).json(roles);
  } catch (error) {
    console.error("Get all roles error:", error);
    res.status(500).json({ message: "Server error retrieving roles" });
  }
};

// Get all permissions
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany();
    res.status(200).json(permissions);
  } catch (error) {
    console.error("Get all permissions error:", error);
    res.status(500).json({ message: "Server error retrieving permissions" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  getAllRoles,
  getAllPermissions,
};
