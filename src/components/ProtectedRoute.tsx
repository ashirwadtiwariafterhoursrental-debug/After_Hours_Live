import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [isPartner, setIsPartner] = useState<boolean>(false);
  const [redirectState, setRedirectState] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthenticated(false);
        setIsPartner(false);
        setLoading(false);
        return;
      }

      try {
        setAuthenticated(true);
        // Query the 'users' collection with the user's specific UID
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.role === "partner") {
            setIsPartner(true);
          } else {
            // Logged in but unauthorized role: force signOut and redirect with state
            await signOut(auth);
            setAuthenticated(false);
            setIsPartner(false);
            setRedirectState({ error: "Access Denied" });
          }
        } else {
          // No Firestore user document found: force signOut and redirect as well
          await signOut(auth);
          setAuthenticated(false);
          setIsPartner(false);
          setRedirectState({ error: "Access Denied" });
        }
      } catch (error) {
        console.error("ProtectedRoute: checking partner role error: ", error);
        // Error cases: force signOut for maximum security
        await signOut(auth);
        setAuthenticated(false);
        setIsPartner(false);
        setRedirectState({ error: "Access Denied" });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        {/* Sleek, dark-themed loading spinner using PlayStation Blue (#003791) */}
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-[#003791] animate-spin"></div>
          <div className="absolute w-8 h-8 rounded-full bg-black border border-slate-900 flex items-center justify-center">
            <span className="text-[10px] font-mono text-[#003791] font-black">P</span>
          </div>
        </div>
        <div className="text-xs uppercase tracking-[0.25em] font-mono text-slate-400 font-bold animate-pulse">
          Securing Connection...
        </div>
      </div>
    );
  }

  // Redirect if unauthorized
  if (!authenticated) {
    return <Navigate to="/partner-login" state={redirectState} replace />;
  }

  if (!isPartner) {
    return <Navigate to="/partner-login" state={{ error: "Access Denied" }} replace />;
  }

  return <>{children}</>;
}
