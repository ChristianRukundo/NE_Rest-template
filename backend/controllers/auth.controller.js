const bcrypt = require("bcrypt");
const prisma = require("../config/database");
const { generateToken } = require("../config/auth");
const { sendEmail } = require("../config/email");
const {
  generateVerificationCode,
  generateResetToken,
} = require("../utils/helpers");
const {
  validateEmail,
  validatePassword,
  validateUsername,
} = require("../utils/validation");

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email, and password are required" });
    }

    if (!validateUsername(username)) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

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

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Get default role (Viewer)
    let viewerRole = await prisma.role.findFirst({
      where: { name: "Viewer" }, // Changed from role_name to name
    });

    if (!viewerRole) {
      // Create roles if they don't exist
      await prisma.role.createMany({
        data: [
          { name: "Admin", description: "Administrator with full access" }, // Changed from role_name to name
          { name: "Viewer", description: "User with view-only access" }, // Changed from role_name to name
          { name: "Buyer", description: "User who can purchase items" }, // Changed from role_name to name
        ],
        skipDuplicates: true,
      });

      viewerRole = await prisma.role.findFirst({
        where: { name: "Viewer" }, // Changed from role_name to name
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role_id: viewerRole.id, // Changed from role_id to id
        email_verification_code: verificationCode,
      },
    });

    // Send verification email
    await sendEmail(
      email,
      "Email Verification",
      `Your verification code is: ${verificationCode}`,
      `<p>Your verification code is: <strong>${verificationCode}</strong></p>`
    );

    res.status(201).json({
      message:
        "User registered successfully. Please check your email for verification code.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.email_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (user.email_verification_code !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id }, // Changed from user_id to id
      data: {
        email_verified: true,
        email_verification_code: null,
      },
    });

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Server error during email verification" });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({
        message: "Email not verified. Please verify your email first.",
      });
    }

    // Generate JWT
    const token = generateToken({
      user_id: user.id,
      role_id: user.role_id,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role.name, // Changed from role_name to name
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    console.log(req.user);
    const user = await prisma.user.findUnique({
      where: { id: req.user.user_id }, // Changed from user_id to id
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role_id: user.role_id },
      include: { permission: true },
    });

    const permissions = rolePermissions.map((rp) => rp.permission.name); // Changed from permission_name to name

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      email_verified: user.email_verified,
      role: user.role.name, // Changed from role_name to name
      permissions,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res
      .status(500)
      .json({ message: "Server error retrieving user information" });
  }
};

// Request password reset
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Update user
    await prisma.user.update({
      where: { id: user.id }, // Changed from user_id to id
      data: {
        password_reset_token: resetToken,
        password_reset_expires: resetExpires,
      },
    });

    // Send email with reset code
    await sendEmail(
      email,
      "Password Reset",
      `Your password reset code is: ${resetToken.substring(0, 6)}`,
      `<p>Your password reset code is: <strong>${resetToken.substring(
        0,
        6
      )}</strong></p>`
    );

    res.status(200).json({ message: "Password reset code sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res
      .status(500)
      .json({ message: "Server error during password reset request" });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { email, verification_code, password } = req.body;

    if (!email || !verification_code || !password) {
      return res.status(400).json({
        message: "Email, verification code, and new password are required",
      });
    }

    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the first 6 characters of the reset token match the verification code
    if (
      !user.password_reset_token ||
      user.password_reset_token.substring(0, 6) !== verification_code
    ) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    // Check if token expired
    if (user.password_reset_expires < new Date()) {
      return res.status(400).json({ message: "Reset code expired" });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user
    await prisma.user.update({
      where: { id: user.id }, // Changed from user_id to id
      data: {
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null,
      },
    });

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { firstName, lastName, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update data
    const updateData = {
      first_name: firstName,
      last_name: lastName,
    };

    // Handle password update if requested
    if (newPassword) {
      // Verify current password
      if (!currentPassword) {
        return res.status(400).json({
          message: "Current password is required to set a new password",
        });
      }

      const passwordMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!passwordMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Validate new password
      if (!validatePassword(newPassword)) {
        return res.status(400).json({
          message:
            "New password must be at least 8 characters long and include at least one number, one uppercase letter, and one special character",
        });
      }

      // Hash new password
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(newPassword, saltRounds);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { role: true },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: updatedUser.role.name,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      message: "Failed to update profile. Please try again.",
    });
  }
};



module.exports = {
  register,
  verifyEmail,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  updateProfile,
};
