import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-border mt-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="font-serif text-3xl tracking-tight text-foreground">
              mallow
            </Link>
            <p className="mt-6 text-muted-foreground text-sm leading-relaxed max-w-md">
              Puur natuurlijke huidverzorging, met liefde gemaakt in Nederland. 
              Onze balsems zijn verrijkt met de zuiverste ingrediënten uit de natuur.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-serif text-lg mb-6">Navigatie</h4>
            <ul className="space-y-4">
              <li>
                <Link 
                  to="/shop" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-shop-link"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link 
                  to="/over-ons" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-about-link"
                >
                  Over Ons
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-contact-link"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>info@mallow.nl</li>
              <li>+31 6 12345678</li>
              <li>Betuwe, Nederland</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Mallow. Alle rechten voorbehouden.
          </p>
          <div className="flex space-x-8">
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              Privacybeleid
            </span>
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              Algemene voorwaarden
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
