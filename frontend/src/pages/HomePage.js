import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, Droplet, Heart } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/products`);
        setProducts(response.data);
      } catch (e) {
        console.error('Error fetching products:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section - Full Screen Immersive */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1762327161548-66c0633335b8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGFwcGx5aW5nJTIwZmFjZSUyMGNyZWFtJTIwbmF0dXJhbCUyMGxpZ2h0JTIwbWluaW1hbGlzdHxlbnwwfHx8fDE3NzE1MTc3MTV8MA&ixlib=rb-4.1.0&q=85"
            alt="Natuurlijke huidverzorging"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-6 lg:px-12 pt-20">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-6">
                  Handgemaakt in Nederland
                </p>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
                className="font-serif text-5xl sm:text-6xl lg:text-7xl text-foreground leading-[1.1] mb-8"
              >
                De essentie van<br />
                <span className="italic text-primary">pure</span> verzorging
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg"
              >
                Ontdek onze collectie handgemaakte balsems, verrijkt met de 
                zuiverste ingrediënten uit de natuur. Voor een huid die straalt.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/shop" data-testid="hero-shop-button">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-500 uppercase tracking-[0.2em] text-xs px-10 py-6 rounded-none w-full sm:w-auto group">
                    Ontdek collectie
                    <ArrowRight className="ml-3 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/over-ons" data-testid="hero-about-button">
                  <Button variant="outline" className="border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-all duration-500 uppercase tracking-[0.2em] text-xs px-10 py-6 rounded-none w-full sm:w-auto">
                    Ons verhaal
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Scroll</span>
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-px h-12 bg-gradient-to-b from-foreground/40 to-transparent"
            />
          </div>
        </motion.div>
      </section>

      {/* Featured Product Strip */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm tracking-wide">
              <span className="opacity-70">Nieuw:</span> Ontdek de Honingbalsem — helend & zuiverend
            </p>
            <Link 
              to="/product/honingbalsem" 
              className="text-sm uppercase tracking-[0.15em] border-b border-primary-foreground/40 hover:border-primary-foreground transition-colors pb-1"
            >
              Bekijk product
            </Link>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="px-6 lg:px-12 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-24"
          >
            <div className="text-center group">
              <div className="w-16 h-16 border border-border rounded-full flex items-center justify-center mx-auto mb-8 transition-all duration-500 group-hover:border-primary group-hover:bg-primary/5">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-4">100% Natuurlijk</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                Al onze producten zijn gemaakt met pure, natuurlijke ingrediënten. 
                Geen synthetische toevoegingen.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 border border-border rounded-full flex items-center justify-center mx-auto mb-8 transition-all duration-500 group-hover:border-primary group-hover:bg-primary/5">
                <Droplet className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-4">Handgemaakt</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                Elke pot wordt met liefde en zorg met de hand gemaakt in ons 
                atelier in de Betuwe.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 border border-border rounded-full flex items-center justify-center mx-auto mb-8 transition-all duration-500 group-hover:border-primary group-hover:bg-primary/5">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-4">Dierproefvrij</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                Wij testen nooit op dieren. Onze producten zijn cruelty-free 
                en verantwoord geproduceerd.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="px-6 lg:px-12 py-24 lg:py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 lg:mb-20">
            <div>
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4"
              >
                De Collectie
              </motion.p>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-serif text-3xl lg:text-5xl"
              >
                Onze Balsems
              </motion.h2>
            </div>
            <Link 
              to="/shop"
              className="mt-6 md:mt-0 text-sm uppercase tracking-[0.15em] text-foreground hover:opacity-70 transition-opacity flex items-center group"
              data-testid="view-all-products"
            >
              Bekijk alles
              <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted mb-6"></div>
                  <div className="h-6 bg-muted w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Ingredient Showcase */}
      <section className="px-6 lg:px-12 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Onze Ingrediënten
              </p>
              <h2 className="font-serif text-3xl lg:text-5xl mb-8">
                Puur van<br />
                <span className="italic">de natuur</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
                Elk ingrediënt wordt zorgvuldig geselecteerd voor zijn unieke 
                eigenschappen. Van Nederlandse bijenwas tot koudgeperste oliën — 
                wij gebruiken alleen het allerbeste.
              </p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center text-sm">
                  <span className="w-8 h-px bg-primary mr-4"></span>
                  Biologische bijenwas uit de Betuwe
                </li>
                <li className="flex items-center text-sm">
                  <span className="w-8 h-px bg-primary mr-4"></span>
                  Koudgeperste oliën
                </li>
                <li className="flex items-center text-sm">
                  <span className="w-8 h-px bg-primary mr-4"></span>
                  Etherische oliën van therapeutische kwaliteit
                </li>
              </ul>
              <Link to="/over-ons" data-testid="about-teaser-link">
                <Button variant="outline" className="border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-all duration-500 uppercase tracking-[0.15em] text-xs px-8 py-5 rounded-none">
                  Meer over onze werkwijze
                  <ArrowRight className="ml-3 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[3/4] bg-card border border-border overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1769258263607-d997358546a7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwxfHxob25leWNvbWIlMjB0ZXh0dXJlJTIwbWFjcm8lMjBhbWJlciUyMGxpZ2h0fGVufDB8fHx8MTc3MTUxNzcxNXww&ixlib=rb-4.1.0&q=85"
                      alt="Honing textuur"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="aspect-[3/4] bg-card border border-border overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1749803848970-0824922db673?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxsYXZlbmRlciUyMGZsb3dlcnMlMjBzb2Z0JTIwZm9jdXN8ZW58MHx8fHwxNzcxNTE3NzE4fDA&ixlib=rb-4.1.0&q=85"
                      alt="Lavendel bloemen"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 lg:px-12 py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-serif text-3xl lg:text-5xl mb-6">
              Ervaar het verschil
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
              Geef je huid de verzorging die het verdient. Ontdek onze collectie 
              en voel de kracht van pure, natuurlijke ingrediënten.
            </p>
            <Link to="/shop">
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 transition-all duration-500 uppercase tracking-[0.2em] text-xs px-12 py-6 rounded-none">
                Shop nu
                <ArrowRight className="ml-3 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
