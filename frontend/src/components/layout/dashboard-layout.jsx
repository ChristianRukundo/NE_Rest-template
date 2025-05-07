import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Menu } from "lucide-react";
import { Button } from "../ui/button";

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // Auto-close on mobile
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        ${collapsed ? "w-20" : "w-72"}
        lg:static lg:translate-x-0 lg:shadow-none`}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        <Header
          sidebarCollapsed={collapsed}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main
          className={`flex-1 overflow-y-auto transition-all duration-300 
          ${collapsed ? "lg:ml-0" : ""}
          p-4 md:p-6 bg-gray-50`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
