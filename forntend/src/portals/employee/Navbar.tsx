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
import { Settings, HelpCircle, LogOut, User, RefreshCw } from "lucide-react";

interface EmployeeNavbarProps {
  employeeName: string;
  employeeEmail: string;
  employeeRole: string;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function EmployeeNavbar({
  employeeName,
  employeeEmail,
  employeeRole,
  onLogout,
  onRefresh,
  isRefreshing = false,
}: EmployeeNavbarProps): React.ReactElement {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();

  const employeeInitials =
    employeeName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "E";

  const navItems = [
    { label: "Appointments", path: "/employee/appointments" },
    { label: "Patients", path: "/employee/patients" },
    { label: "Doctors", path: "/employee/doctors" },
    { label: "Payments", path: "/employee/payments" },
    { label: "Schedule", path: "/employee/schedule" },
    { label: "Reports", path: "/employee/reports" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                    ? "text-slate-900 bg-blue-50 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Profile Dropdown */}
          <DropdownMenu
            open={showProfileMenu}
            onOpenChange={setShowProfileMenu}
          >
            <DropdownMenuTrigger asChild>
              <button
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 text-white font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Open profile menu"
              >
                {employeeInitials}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {/* User Info */}
              <div className="px-2 py-1.5">
                <p className="font-semibold text-sm text-slate-900">
                  {employeeName || "Employee"}
                </p>
                <p className="text-xs text-slate-500">{employeeEmail}</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  {employeeRole}
                </p>
              </div>

              <DropdownMenuSeparator />

              {/* Menu Items */}
              <DropdownMenuItem
                onClick={() => navigate("/employee/profile")}
                className="cursor-pointer"
              >
                <User className="w-4 h-4 mr-2" />
                My Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/employee/settings")}
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/employee/help")}
                className="cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Logout */}
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
