import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Search,
  Menu,
} from "lucide-react";
import { useAuth } from "../../context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

export const Header = ({ sidebarCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-xl font-semibold text-gray-800 leading-none">
              Hello {user?.first_name || "User"} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{getGreeting()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <div className="flex items-center rounded-full bg-gray-100 px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all duration-200">
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ml-2 bg-transparent border-none outline-none focus:outline-none text-sm w-48 md:w-64 placeholder-gray-400 text-gray-600"
              />
            </div>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full h-9 w-9 bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-gray-100 transition-colors duration-200">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                  <img
                    src={`https://ui-avatars.com/api/?name=${
                      user?.first_name || "U"
                    }+${user?.last_name || "ser"}&background=3b82f6&color=fff`}
                    alt={`${user?.first_name || "User"}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm text-left hidden sm:block">
                  <div className="font-medium text-gray-700">
                    {user?.first_name || "User"} {user?.last_name || ""}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role || "User"}
                  </div>
                </div>
                <ChevronDown
                  size={16}
                  className="text-gray-400 hidden sm:block"
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 mt-1 p-1 rounded-lg border border-gray-200 shadow-lg"
            >
              <div className="px-2 py-1.5 mb-1 border-b sm:hidden">
                <p className="font-medium text-sm text-gray-700">
                  {user?.first_name || "User"} {user?.last_name || ""}
                </p>
                <p className="text-xs text-gray-500">{user?.role || "User"}</p>
              </div>
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="flex items-center py-2 px-2 text-sm text-gray-700 cursor-pointer rounded-md hover:bg-gray-100"
              >
                <User className="mr-2 h-4 w-4 text-gray-500" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="flex items-center py-2 px-2 text-sm text-gray-700 cursor-pointer rounded-md hover:bg-gray-100"
              >
                <Settings className="mr-2 h-4 w-4 text-gray-500" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 h-px bg-gray-200" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center py-2 px-2 text-sm text-red-600 cursor-pointer rounded-md hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
