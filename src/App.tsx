import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ChatSupport } from "./components/ChatSupport";
import { Home } from "./pages/Home";
import { Experiences } from "./pages/Experiences";
import { Corporate } from "./pages/Corporate";
import { Rentals } from "./pages/Rentals";
import { Contact } from "./pages/Contact";
import { Checkout } from "./pages/Checkout";

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
      <div className="min-h-screen bg-afterhours-black text-white selection:bg-afterhours-green selection:text-black">
        <Navbar />
        <ChatSupport />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/corporate" element={<Corporate />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}
