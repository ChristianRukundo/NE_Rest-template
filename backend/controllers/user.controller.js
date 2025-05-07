const bcrypt = require("bcrypt");
const prisma = require("../config/database");

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.user_id }, // Changed from user_id to id
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
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error retrieving user profile" });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { first_name, last_name, current_password, new_password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.user_id }, // Changed from user_id to id
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {};

    // Update name fields if provided
    if (first_name !== undefined) {
      updateData.first_name = first_name;
    }

    if (last_name !== undefined) {
      updateData.last_name = last_name;
    }

    // Update password if provided
    if (current_password && new_password) {
      // Verify current password
      const passwordMatch = await bcrypt.compare(
        current_password,
        user.password
      );
      if (!passwordMatch) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(new_password, saltRounds);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.user_id }, // Changed from user_id to id
      data: updateData,
      include: { role: true },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id, // Changed from user_id to id
        username: updatedUser.username,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        role: updatedUser.role.name, // Changed from role_name to name
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error updating user profile" });
  }
};

// Update profile picture
const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Assuming you have a cloudinary or similar service to handle image uploads
    // and the URL is returned in req.file.path or similar
    const imageUrl = req.file.path || req.file.location;

    const user = await prisma.user.findUnique({
      where: { id: req.user.user_id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user with new profile picture
    const updatedUser = await prisma.user.update({
      where: { id: req.user.user_id },
      data: {
        profile_picture: imageUrl,
      },
      include: { role: true },
    });

    res.status(200).json({
      message: "Profile picture updated successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        profile_picture: updatedUser.profile_picture,
        role: updatedUser.role.name,
      },
    });
  } catch (error) {
    console.error("Update profile picture error:", error);
    res.status(500).json({ message: "Server error updating profile picture" });
  }
};

// Get user's own transactions
const getUserTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      startDate,
      endDate,
      sortBy = "transaction_date",
      order = "desc",
    } = req.query;

    // Parse pagination parameters
    const pageNum = Number.parseInt(page);
    const limitNum = Number.parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where = {
      user_id: req.user.user_id,
    };

    // Filter by transaction type
    if (type) {
      where.transaction_type = type;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.transaction_date = {};
      if (startDate) {
        where.transaction_date.gte = new Date(startDate);
      }
      if (endDate) {
        where.transaction_date.lte = new Date(endDate);
      }
    }

    // Build sort options
    const orderBy = {};
    orderBy[sortBy] = order.toLowerCase() === "desc" ? "desc" : "asc";

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({ where });

    // Get transactions with pagination
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        item: true,
      },
    });

    res.status(200).json({
      data: transactions,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Get user transactions error:", error);
    res
      .status(500)
      .json({ message: "Server error retrieving user transactions" });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  getUserTransactions,
};
