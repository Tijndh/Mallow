import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Brand */}
            <div className="lg:col-span-5">
              <Link to="/" className="font-serif text-4xl lg:text-5xl tracking-tight">
                mallow
              </Link>
              <p className="mt-8 text-primary-foreground/70 text-sm leading-relaxed max-w-sm">
                Puur natuurlijke huidverzorging, met liefde gemaakt in Nederland. 
                Onze balsems zijn verrijkt met de zuiverste ingrediënten uit de natuur.
              </p>
              <Link 
                to="/shop" 
                className="inline-flex items-center mt-8 text-sm uppercase tracking-[0.15em] border-b border-primary-foreground/30 hover:border-primary-foreground transition-colors pb-1 group"
              >
                Ontdek de collectie
                <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Navigation */}
            <div className="lg:col-span-2 lg:col-start-8">
              <h4 className="text-xs uppercase tracking-[0.2em] text-primary-foreground/50 mb-6">Shop</h4>
              <ul className="space-y-4">
                <li>
                  <Link 
                    to="/shop" 
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                    data-testid="footer-shop-link"
                  >
                    Alle producten
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/product/puur-twellow-balsem" 
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    Puur Twellow Balsem
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/product/honingbalsem" 
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    Honingbalsem
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/product/castorbalsem" 
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    Castorbalsem
                  </Link>
                </li>
              </ul>
            </div>

            {/* Info */}
            <div className="lg:col-span-2">
              <h4 className="text-xs uppercase tracking-[0.2em] text-primary-foreground/50 mb-6">Info</h4>
              <ul className="space-y-4">
                <li>
                  <Link 
                    to="/over-ons" 
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                    data-testid="footer-about-link"
                  >
                    Over Ons
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/contact" 
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                    data-testid="footer-contact-link"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="lg:col-span-2">
              <h4 className="text-xs uppercase tracking-[0.2em] text-primary-foreground/50 mb-6">Contact</h4>
              <ul className="space-y-4 text-sm text-primary-foreground/80">
                <li>info@mallow.nl</li>
                <li>+31 6 12345678</li>
                <li>Betuwe, Nederland</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} Mallow. Alle rechten voorbehouden.
          </p>
          <div className="flex gap-8">
            <span className="text-xs text-primary-foreground/50 hover:text-primary-foreground cursor-pointer transition-colors">
              Privacybeleid
            </span>
            <span className="text-xs text-primary-foreground/50 hover:text-primary-foreground cursor-pointer transition-colors">
              Algemene voorwaarden
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
