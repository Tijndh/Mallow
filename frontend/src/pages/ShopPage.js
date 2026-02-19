import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ShopPage() {
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
    <div className="min-h-screen pt-20" data-testid="shop-page">
      {/* Header */}
      <section className="px-6 lg:px-12 py-16 lg:py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
              Onze Collectie
            </p>
            <h1 className="font-serif text-4xl lg:text-5xl mb-6">
              Natuurlijke Balsems
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Ontdek onze handgemaakte balsems, gemaakt met pure ingrediënten 
              en veel liefde. Elk product is ontworpen om jouw huid te voeden 
              en te beschermen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted mb-6"></div>
                  <div className="h-6 bg-muted w-3/4 mb-2"></div>
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
      <section className="px-6 lg:px-12 py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
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
