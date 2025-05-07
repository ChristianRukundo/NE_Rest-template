const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.user_id },
      include: { role: true },
    });

    console.log("user from the middle ware");
    console.log(user);

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Get user permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role_id: user.role_id },
      include: { permission: true },
    });

    const permissions = rolePermissions.map((rp) => rp.permission.name);

    console.log(permissions);
    // Add user to request object
    req.user = {
      user_id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role_id: user.role_id,
      role: user.role.name,
      permissions,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Middleware to check user role
const checkRole = (roleName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role === roleName) {
      next();
    } else {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }
  };
};

// Middleware to check user permission
const checkPermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (
      req.user.permissions.includes(permissionName) ||
      req.user.role === "Admin"
    ) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
  };
};

// Middleware to check if user has any of the required permissions
const checkAnyPermission = (permissionNames) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has any of the required permissions or is Admin
    if (
      req.user.role === "Admin" ||
      permissionNames.some((permission) =>
        req.user.permissions.includes(permission)
      )
    ) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
  };
};

module.exports = {
  authenticateToken,
  checkRole,
  checkPermission,
  checkAnyPermission,
  verifyToken: authenticateToken, // For backward compatibility
  hasPermission: checkPermission, // For backward compatibility
  hasAnyPermission: checkAnyPermission, // For backward compatibility
  isAdmin: checkRole("Admin"), // For backward compatibility
};
