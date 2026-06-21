import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const isAdminAuthenticated = localStorage.getItem("isAdminAuthenticated") === "true";
      const isAuthAdmin = user && (user.email === "afterhoursrental@gmail.com" || user.email === "arjuntiwari8604@gmail.com");

      if (isAdminAuthenticated && isAuthAdmin) {
        setIsAdminVerified(true);
      } else {
        setIsAdminVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <div id="admin-gatekeeper-loader" className="flex h-screen items-center justify-center bg-slate-50 text-[#003791] font-sans font-semibold">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#003791]"></div>
          <span>Verifying Admin Credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAdminVerified) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

