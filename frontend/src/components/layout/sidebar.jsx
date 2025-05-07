import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart2,
  FileText,
  Settings,
  ShoppingBag,
  User,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "../ui/button";
import { Logo } from "../ui/logo";
import { cn } from "../../lib/utils";

export const Sidebar = ({ onClose, collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Check if the user has a specific permission
  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission);
  };
  // Define navigation items based on user permissions
  const navigationItems = [
    {
      name: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      href: "/dashboard",
      visible: true,
    },
    {
      name: "Inventory",
      icon: <Package className="h-5 w-5" />,
      href: "/items",
      visible:
        hasPermission("read_item") || hasPermission("read_item_for_sale"),
    },
    {
      name: "Transactions",
      icon: <FileText className="h-5 w-5" />,
      href: "/transactions",
      visible: hasPermission("read_transactions"),
    },
    {
      name: "My Purchases",
      icon: <ShoppingBag className="h-5 w-5" />,
      href: "/my-transactions",
      visible: hasPermission("create_sale_transaction"),
    },
    {
      name: "Shop",
      icon: <ShoppingCart className="h-5 w-5" />,
      href: "/shop",
      visible: hasPermission("read_item_for_sale"),
    },
    {
      name: "Users",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/users",
      visible: hasPermission("manage_users"),
    },
    {
      name: "Reports",
      icon: <BarChart2 className="h-5 w-5" />,
      href: "/reports",
      visible: hasPermission("export_reports"),
    },
    {
      name: "Profile",
      icon: <User className="h-5 w-5" />,
      href: "/profile",
      visible: true,
    },
  ];

  // Filter out items that shouldn't be visible to the current user
  const visibleItems = navigationItems.filter((item) => item.visible);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-lg border-r relative">
      {/* Sidebar Header */}
      <div
        className={cn(
          "flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white",
          collapsed ? "px-2" : "px-4"
        )}
      >
        {!collapsed ? (
          <div className="flex items-center">
            <Logo className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">Inventory</span>
          </div>
        ) : (
          <Logo className="h-8 w-8 mx-auto text-blue-600" />
        )}

        <div className="flex items-center">
          {/* Close button - only on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden rounded-full p-0 h-8 w-8 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Collapse Toggle Button - Desktop only */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-16 hidden lg:flex items-center justify-center h-6 w-6 rounded-full bg-white shadow-md border border-gray-200 text-gray-500 z-10"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <ul className="space-y-1.5">
          {visibleItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              location.pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.name}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center gap-3 font-medium rounded-lg text-sm transition-all duration-200",
                    collapsed ? "justify-center px-2" : "justify-start px-3",
                    isActive
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={() => {
                    navigate(item.href);
                    if (onClose && window.innerWidth < 1024) onClose();
                  }}
                >
                  <span
                    className={cn(
                      "flex-shrink-0",
                      isActive ? "text-blue-600" : "text-gray-500"
                    )}
                  >
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span
                      className={cn(
                        "whitespace-nowrap",
                        isActive ? "font-medium" : ""
                      )}
                    >
                      {item.name}
                    </span>
                  )}

                  {/* Active indicator */}
                  {isActive && collapsed && (
                    <span className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"></span>
                  )}

                  {isActive && !collapsed && (
                    <span className="absolute right-3 w-1 h-6 rounded-full bg-blue-600"></span>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile area */}
      <div
        className={cn(
          "p-3 mt-auto border-t border-gray-200",
          collapsed ? "text-center" : ""
        )}
      >
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                <img
                  src={`https://ui-avatars.com/api/?name=${
                    user?.first_name || "U"
                  }+${user?.last_name || "ser"}&background=3b82f6&color=fff`}
                  alt={`${user?.first_name || "User"}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">
                  {user?.first_name || "User"}
                </p>
                <p className="text-xs text-gray-500">{user?.role || "User"}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm mb-2">
              <img
                src={`https://ui-avatars.com/api/?name=${
                  user?.first_name || "U"
                }+${user?.last_name || "ser"}&background=3b82f6&color=fff`}
                alt={`${user?.first_name || "User"}`}
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 mt-1"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
