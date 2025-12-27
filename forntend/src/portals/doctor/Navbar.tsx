import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  HelpCircle,
  LogOut,
  User,
  RefreshCw,
  Bell,
} from "lucide-react";
import authService from "@/services/authService";

interface DoctorNavbarProps {
  notificationCount?: number;
}

export default function DoctorNavbar({
  notificationCount,
}: DoctorNavbarProps): React.ReactElement {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();

  // Get doctor data from auth service
  const doctorId = authService.getDoctorId() || "";
  const doctorName = authService.getFullName() || "Doctor";
  const doctorEmail = authService.getEmail() || "";
  const doctorSpecialty =
    authService.getSpecialization() || "Medical Professional";

  // Handle logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/doctor-login", { replace: true });
  };

  // Handle refresh user data
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await authService.refreshUserData();
      console.log("✅ User data refreshed successfully");
    } catch (error) {
      console.error("❌ Failed to refresh user data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const doctorInitials =
    doctorName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "D";

  // Doctor-specific navigation items
  const navItems = [
    { label: "Dashboard", path: "/doctor/dashboard" },
    // { label: "Appointments", path: "/doctor/appointments" },
    { label: "Patients", path: "/doctor/patients" },
    { label: "Consultations", path: "/doctor/consultations" },
    { label: "Schedule", path: "/doctor/schedule" },
    { label: "Catalogue", path: "/doctor/catalogue" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-15 h-15 flex items-center justify-center">
              <img
                src="/assets/logo.jpg"
                alt="MedSync"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">MedSync</h1>
              <p className="text-xs text-slate-500">Employee Portal</p>
            </div>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-md ${
                  location.pathname === item.path
                    ? "text-slate-900 bg-emerald-50 font-bold "
                    : "text-slate-600 hover:text-slate-900 hover:bg-emerald-50/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <DropdownMenu
              open={showProfileMenu}
              onOpenChange={setShowProfileMenu}
            >
              <DropdownMenuTrigger asChild>
                <button
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white font-semibold flex items-center justify-center hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
                  title="Open profile menu"
                >
                  {doctorInitials}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                {/* User Info Section */}
                <div className="px-2 py-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white font-bold flex items-center justify-center text-lg">
                      {doctorInitials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">
                        Dr. {doctorName || "Doctor"}
                      </p>
                      <p className="text-xs text-slate-500">{doctorEmail}</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        {doctorSpecialty}
                      </p>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Menu Items */}
                <DropdownMenuItem
                  onClick={() => navigate("/doctor/profile")}
                  className="cursor-pointer focus:bg-emerald-50"
                >
                  <User className="w-4 h-4 mr-2 text-emerald-600" />
                  <span>My Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate("/doctor/settings")}
                  className="cursor-pointer focus:bg-emerald-50"
                >
                  <Settings className="w-4 h-4 mr-2 text-emerald-600" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate("/doctor/help")}
                  className="cursor-pointer focus:bg-emerald-50"
                >
                  <HelpCircle className="w-4 h-4 mr-2 text-emerald-600" />
                  <span>Help & Support</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
