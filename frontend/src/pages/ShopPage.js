import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { FALLBACK_PRODUCTS } from '../lib/fallbackProducts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://mallow.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/products`);
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
    <div className="min-h-screen pt-20" data-testid="shop-page">
      {/* Header */}
      <section className="px-6 lg:px-12 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
              De Collectie
            </p>
            <h1 className="font-serif text-4xl lg:text-6xl mb-8">
              Onze Balsems
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Ontdek onze handgemaakte balsems, gemaakt met pure ingrediënten 
              en veel liefde. Elk product is ontworpen om jouw huid te voeden 
              en te beschermen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-6 lg:px-12 pb-24 lg:pb-32">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted mb-8"></div>
                  <div className="h-6 bg-muted w-3/4 mb-3"></div>
                  <div className="h-4 bg-muted w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Info Banner */}
      <section className="px-6 lg:px-12 py-16 lg:py-20 bg-secondary/50 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <p className="font-serif text-lg mb-2">Gratis Verzending</p>
              <p className="text-sm text-muted-foreground">Bij bestellingen boven €50</p>
            </div>
            <div>
              <p className="font-serif text-lg mb-2">Veilig Betalen</p>
              <p className="text-sm text-muted-foreground">Via iDEAL, creditcard of PayPal</p>
            </div>
            <div>
              <p className="font-serif text-lg mb-2">Persoonlijke Service</p>
              <p className="text-sm text-muted-foreground">Vragen? Wij helpen graag</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
