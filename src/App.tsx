import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ChatSupport } from "./components/ChatSupport";
import { CookieBanner } from "./components/CookieBanner";
import { Home } from "./pages/Home";
import { Experiences } from "./pages/Experiences";
import { Rentals } from "./pages/Rentals";
import { Blog } from "./pages/Blog";
import { Contact } from "./pages/Contact";
import { Checkout } from "./pages/Checkout";
import { Terms } from "./pages/Terms";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CustomerLogin } from "./pages/CustomerLogin";
import { CustomerProfile } from "./pages/CustomerProfile";
import { PartnerDashboard } from "./pages/PartnerDashboard";
import { PartnerLogin } from "./pages/PartnerLogin";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-blue-100 selection:text-[#003791]">
        <Navbar />
        <ChatSupport />
        <CookieBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />
          <Route path="/customer-login" element={<CustomerLogin />} />
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/partner-login" element={<PartnerLogin />} />
          <Route path="/partner-dashboard" element={
            <ProtectedRoute>
              <PartnerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/partner-hub" element={
            <ProtectedRoute>
              <PartnerDashboard />
            </ProtectedRoute>
          } />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}
