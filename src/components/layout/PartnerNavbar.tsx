import React from "react";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { LogOut, Home } from "lucide-react";

export function PartnerNavbar() {
  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="w-full bg-white border-b border-slate-200 py-4 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm font-sans">
      <div className="flex items-center gap-3">
        <span className="text-xl font-black tracking-tight text-[#003791] uppercase italic">
          AFTER HOURS PARTNER
        </span>
      </div>
      <div className="flex items-center gap-6 text-sm font-bold">
        <a 
          href="/partner-dashboard" 
          onClick={handleHomeClick} 
          className="text-slate-600 hover:text-[#003791] transition-colors flex items-center gap-1.5"
        >
          <Home className="w-4 h-4 text-[#003791]" />
          <span>Home</span>
        </a>
        <button 
          onClick={handleLogout} 
          className="text-slate-600 hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
