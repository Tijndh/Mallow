import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://mallow.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function DiscountPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();

  const hasOpenedRef = useRef(false); // 🔥 voorkomt dubbele triggers

  useEffect(() => {
    if (location.pathname === "/cart" || location.pathname === "/success") {
      return;
    }

    const alreadyShown = sessionStorage.getItem("discount_popup_shown");
    if (alreadyShown) return;

    const openPopup = () => {
      if (hasOpenedRef.current) return;

      hasOpenedRef.current = true;
      sessionStorage.setItem("discount_popup_shown", "true");
      setIsOpen(true);

      document.removeEventListener("mouseleave", handleMouseLeave);
    };

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) {
        openPopup();
      }
    };

    // Timer trigger (4 sec)
    const timer = setTimeout(openPopup, 4000);

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [location.pathname]);

  // ESC sluiten
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API}/subscribe`, { email });
      setSuccess(true);
      setMessage(response.data.message);
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(true);
  };

  const handleReopen = () => {
    setIsMinimized(false);
    setIsOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 flex items-center justify-center z-50 px-4"
            >
              <div
                className="relative bg-white w-full max-w-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 p-2 text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="grid md:grid-cols-2">
                  {/* Image */}
                  <div className="relative h-56 md:h-auto">
                    <img
                      src="https://rkslplssrwecnwjscyij.supabase.co/storage/v1/object/public/user-assets/b3e25851-ebaa-451f-a616-f017255c769a/images/character_image_1771587689765_khsysgd39.jpg"
                      alt="15% korting"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:bg-gradient-to-r" />
                  </div>

                  {/* Content */}
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    {!success ? (
                      <>
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">
                          Exclusieve aanbieding
                        </p>

                        <h2 className="font-serif text-3xl mb-4">
                          Ontvang 15% korting
                        </h2>

                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                          Schrijf je in en ontvang direct je kortingscode.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                          <Input
                            type="email"
                            placeholder="Je e-mailadres"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />

                          {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                          )}

                          <Button
                            type="submit"
                            disabled={loading}
                            className="w-full uppercase tracking-wider py-6"
                          >
                            {loading
                              ? "Even geduld..."
                              : "Ontvang kortingscode"}
                          </Button>
                        </form>

                        <button
                          onClick={handleClose}
                          className="mt-4 text-xs text-gray-400 hover:text-gray-600"
                        >
                          Nee bedankt
                        </button>
                      </>
                    ) : (
                      <div className="text-center">
                        <h2 className="font-serif text-2xl mb-3">
                          Gelukt!
                        </h2>
                        <p className="text-gray-600 text-sm mb-6">
                          {message}
                        </p>
                        <Button onClick={handleClose}>
                          Verder winkelen
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Subtiele shake button */}
      <AnimatePresence>
        {isMinimized && !isOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              x: [0, -2, 2, -2, 2, 0],
            }}
            transition={{
              delay: 3,
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 6,
            }}
            onClick={handleReopen}
            className="fixed bottom-16 right-6 z-50 bg-neutral-900 text-white text-sm tracking-wide px-6 py-3 shadow-lg"
          >
            15% korting
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
