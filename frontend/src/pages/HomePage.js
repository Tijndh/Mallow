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
    <div className="min-h-screen pt-20" data-testid="home-page">
      {/* Hero Section - Bento Grid */}
      <section className="px-6 lg:px-12 py-12 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Main Hero Text */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-5 flex flex-col justify-center py-12 lg:py-24"
            >
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight">
                Puur.<br />
                Natuurlijk.<br />
                <span className="italic">Verzorgd.</span>
              </h1>
              <p className="mt-8 text-muted-foreground text-base lg:text-lg leading-relaxed max-w-md">
                Handgemaakte balsems met pure, natuurlijke ingrediënten. 
                Ontdek de kracht van de natuur voor jouw huid.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link to="/shop" data-testid="hero-shop-button">
                  <Button className="btn-primary rounded-sm w-full sm:w-auto">
                    Ontdek collectie
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/over-ons" data-testid="hero-about-button">
                  <Button variant="outline" className="btn-secondary rounded-sm w-full sm:w-auto">
                    Ons verhaal
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Hero Images Grid */}
            <div className="lg:col-span-7 grid grid-cols-2 gap-4 lg:gap-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="col-span-2 aspect-[16/9] bg-card border border-border overflow-hidden"
              >
                <img
                  src="https://images.unsplash.com/photo-1762327161548-66c0633335b8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGFwcGx5aW5nJTIwZmFjZSUyMGNyZWFtJTIwbmF0dXJhbCUyMGxpZ2h0JTIwbWluaW1hbGlzdHxlbnwwfHx8fDE3NzE1MTc3MTV8MA&ixlib=rb-4.1.0&q=85"
                  alt="Natuurlijke huidverzorging"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="aspect-square bg-card border border-border overflow-hidden"
              >
                <img
                  src="https://images.unsplash.com/photo-1769258263607-d997358546a7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwxfHxob25leWNvbWIlMjB0ZXh0dXJlJTIwbWFjcm8lMjBhbWJlciUyMGxpZ2h0fGVufDB8fHx8MTc3MTUxNzcxNXww&ixlib=rb-4.1.0&q=85"
                  alt="Honing textuur"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="aspect-square bg-card border border-border overflow-hidden"
              >
                <img
                  src="https://images.unsplash.com/photo-1749803848970-0824922db673?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxsYXZlbmRlciUyMGZsb3dlcnMlMjBzb2Z0JTIwZm9jdXN8ZW58MHx8fHwxNzcxNTE3NzE4fDA&ixlib=rb-4.1.0&q=85"
                  alt="Lavendel bloemen"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="px-6 lg:px-12 py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16"
          >
            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-4">100% Natuurlijk</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Al onze producten zijn gemaakt met pure, natuurlijke ingrediënten. 
                Geen synthetische toevoegingen, alleen het beste van de natuur.
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6">
                <Droplet className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-4">Handgemaakt</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Elke pot wordt met liefde en zorg met de hand gemaakt in Nederland. 
                Ambachtelijke kwaliteit in elk product.
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-4">Dierproefvrij</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Wij testen nooit op dieren. Onze producten zijn cruelty-free 
                en worden met respect voor mens en natuur gemaakt.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
            <div>
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm uppercase tracking-widest text-muted-foreground mb-4"
              >
                Onze Collectie
              </motion.p>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-serif text-3xl lg:text-4xl"
              >
                Natuurlijke Balsems
              </motion.h2>
            </div>
            <Link 
              to="/shop"
              className="mt-6 md:mt-0 text-sm uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity flex items-center"
              data-testid="view-all-products"
            >
              Bekijk alles
              <ArrowRight className="ml-2 w-4 h-4" />
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

      {/* About Teaser */}
      <section className="px-6 lg:px-12 py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                Ons Verhaal
              </p>
              <h2 className="font-serif text-3xl lg:text-4xl mb-6">
                Met liefde gemaakt<br />
                <span className="italic">in de Betuwe</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Mallow ontstond uit een passie voor pure, eerlijke huidverzorging. 
                In ons atelier in de Betuwe maken we met de hand elke pot balsem, 
                met ingrediënten die we zorgvuldig selecteren voor hun kwaliteit en werking.
              </p>
              <Link to="/over-ons" data-testid="about-teaser-link">
                <Button variant="outline" className="btn-secondary rounded-sm">
                  Lees meer over ons
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="aspect-[4/3] bg-card border border-border overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/30754235/pexels-photo-30754235.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                  alt="Sheaboter textuur"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
