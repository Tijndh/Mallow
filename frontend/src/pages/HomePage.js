import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Leaf, Droplet, Heart, ArrowDown } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { FALLBACK_PRODUCTS } from '../lib/fallbackProducts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://mallow.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();
  
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.1]);
  const heroY = useTransform(scrollY, [0, 400], [0, 100]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/products`, { timeout: 8000 });
        const nextProducts = Array.isArray(response.data) && response.data.length > 0
          ? response.data
          : FALLBACK_PRODUCTS;
        setProducts(nextProducts);
      } catch (e) {
        console.error('Error fetching products:', e);
        setProducts(FALLBACK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <motion.div 
          style={{ scale: heroScale, y: heroY }}
          className="absolute inset-0"
        >
          <img
            src="https://is.zobj.net/image-server/v1/images?r=rBH7uEJKRHaLOpS1ljx0k9Jw9n9QKUSHj3LBLSMvfvF8xwIo6pvqK50F46uV1N5pMgBHlNrhkO_XPGbICZ1h94x3vSex35v_L0ZBT0EM625cfEFjkthJj6DihPcQJX2jMBNL7dLW7_bi9j7nKnxMpneGFQ0r5higuovtrHwTVyTOjG67ybJ1PnGekx8vcoUWz7FXW0fddYVsGfOEwfSbTsCTgJZolddP_iRXQQ"
            alt="Natuurlijke huidverzorging"
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 30%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent"></div>
        </motion.div>

        <motion.div 
          style={{ opacity: heroOpacity }}
          className="relative z-10 w-full px-6 lg:px-16 pt-20"
        >
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl">
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-8"
              >
                Handgemaakt in Nederland - Lokaal en gifvrij
              </motion.p>
              
              <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-foreground leading-[1.05] mb-10"
              >
                Terug naar<br />
                de <em className="text-primary">basis</em><br />
                van verzorging
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-base lg:text-lg text-muted-foreground leading-relaxed mb-12 max-w-md"
              >
                Ontdek onze collectie handgemaakte balsems, verrijkt met de 
                zuiverste ingrediënten uit de natuur.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex flex-col sm:flex-row gap-5"
              >
                <Link to="/shop" data-testid="hero-shop-button">
                  <button className="btn-premium w-full sm:w-auto flex items-center justify-center gap-3">
                    Ontdek collectie
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link to="/over-ons" data-testid="hero-about-button">
                  <button className="btn-outline-premium w-full sm:w-auto">
                    Ons verhaal
                  </button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-4"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Ontdek meer</span>
            <ArrowDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* 1. Philosophy Section */}
      <section className="px-6 lg:px-16 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">Onze Filosofie</p>
              <h2 className="font-serif text-3xl lg:text-4xl mb-8 leading-tight">
                Minder ingrediënten.<br />
                <em>Meer rust voor je huid.</em>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                In een wereld vol complexe formules en onuitspreekbare ingrediënten, 
                kiezen wij voor eenvoud. Onze balsems bevatten alleen wat je huid 
                echt nodig heeft.
              </p>
              <Link to="/over-ons" className="text-xs uppercase tracking-[0.2em] text-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                Lees ons verhaal
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="aspect-[3/4] bg-[#f5f4f0] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1769258263607-d997358546a7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwxfHxob25leWNvbWIlMjB0ZXh0dXJlJTIwbWFjcm8lMjBhbWJlciUyMGxpZ2h0fGVufDB8fHx8MTc3MTUxNzcxNXww&ixlib=rb-4.1.0&q=85"
                  alt="Honing"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                />
              </div>
              <div className="aspect-[3/4] bg-[#f5f4f0] overflow-hidden mt-8">
                <img
                  src="https://images.unsplash.com/photo-1749803848970-0824922db673?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxsYXZlbmRlciUyMGZsb3dlcnMlMjBzb2Z0JTIwZm9jdXN8ZW58MHx8fHwxNzcxNTE3NzE4fDA&ixlib=rb-4.1.0&q=85"
                  alt="Lavendel"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Products Section */}
      <section className="px-6 lg:px-16 py-16 lg:py-20 bg-[#f5f4f0]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">De Collectie</p>
              <h2 className="font-serif text-3xl lg:text-5xl">Onze Balsems</h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link 
                to="/shop"
                className="text-xs uppercase tracking-[0.2em] text-foreground hover:text-primary transition-colors flex items-center gap-3 group"
                data-testid="view-all-products"
              >
                Bekijk alles
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted mb-8"></div>
                  <div className="h-6 bg-muted w-3/4 mb-3"></div>
                  <div className="h-4 bg-muted w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Values Section */}
      <section className="px-6 lg:px-16 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Onze Waarden</p>
            <h2 className="font-serif text-3xl lg:text-4xl">Waar wij voor staan</h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {[
              { icon: Leaf, title: '100% Natuurlijk', desc: 'Alleen pure, natuurlijke ingrediënten. Geen synthetische toevoegingen.' },
              { icon: Droplet, title: 'Lokaal en Handgemaakt', desc: 'Met liefde gemaakt op de boerderij, met verschillende lokale producten' },
              { icon: Heart, title: 'Eetbaar', desc: 'Wij zijn er van overtuigd dat wat je op je huid smeert ook eetbaar moet zijn, je huid neemt alle stoffen op.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="w-16 h-16 border border-border bg-background rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 group-hover:border-primary group-hover:scale-105">
                  <item.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-lg mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section with Background Image */}
      <section className="relative py-32 lg:py-44 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://rkslplssrwecnwjscyij.supabase.co/storage/v1/object/public/user-assets/b3e25851-ebaa-451f-a616-f017255c769a/images/character_image_1771587689765_khsysgd39.jpg"
            alt="Natuurlijke ingrediënten"
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 60%' }}
          />
          <div className="absolute inset-0 bg-primary/70"></div>
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="font-serif text-3xl lg:text-5xl text-primary-foreground mb-6">
              Geef je huid wat het verdient
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
              Ervaar het verschil van pure, natuurlijke verzorging.
            </p>
            <Link to="/shop">
              <button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 transition-all duration-500 uppercase tracking-[0.25em] text-[11px] font-medium px-12 py-5">
                Ontdek de collectie
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

