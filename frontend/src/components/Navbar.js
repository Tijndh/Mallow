import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cart } = useCart();
  const location = useLocation();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/over-ons', label: 'Over Ons' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = (path) => location.pathname === path;
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled || !isHome 
        ? 'bg-background/98 backdrop-blur-md border-b border-border' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo */}
          <Link 
            to="/" 
            className={`font-serif text-2xl lg:text-3xl tracking-tight transition-colors duration-300 ${
              scrolled || !isHome ? 'text-foreground' : 'text-foreground'
            } hover:opacity-70`}
            data-testid="logo-link"
          >
            mallow
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
                className={`text-xs uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap ${
                  isActive(link.href) 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Cart & Mobile Menu */}
          <div className="flex items-center gap-6">
            <Link
              to="/cart"
              data-testid="cart-button"
              className="relative p-2 hover:opacity-70 transition-opacity"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.item_count > 0 && (
                <span 
                  data-testid="cart-count"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] flex items-center justify-center"
                >
                  {cart.item_count}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 hover:opacity-70 transition-opacity"
              data-testid="mobile-menu-button"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t border-border"
          >
            <div className="px-6 py-10 space-y-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  data-testid={`mobile-nav-${link.label.toLowerCase().replace(' ', '-')}`}
                  className={`block text-sm uppercase tracking-[0.2em] ${
                    isActive(link.href) 
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
