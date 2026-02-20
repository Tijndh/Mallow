import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Check } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API}/products/${id}`);
        setProduct(response.data);
      } catch (e) {
        console.error('Error fetching product:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    setAdding(true);
    const success = await addToCart(product.id, quantity);
    if (success) {
      toast.success('Toegevoegd aan winkelwagen', {
        description: `${quantity}x ${product.name}`,
        duration: 2000,
      });
    } else {
      toast.error('Er ging iets mis', { duration: 2000 });
    }
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            <div className="aspect-square bg-muted animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted w-3/4"></div>
              <div className="h-4 bg-muted w-1/2"></div>
              <div className="h-32 bg-muted w-full mt-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl mb-4">Product niet gevonden</h1>
          <Link to="/shop" className="text-accent hover:underline">
            Terug naar shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20" data-testid="product-page">
      {/* Breadcrumb */}
      <div className="px-6 lg:px-12 py-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <Link 
            to="/shop" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group"
            data-testid="back-to-shop"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
            Terug naar shop
          </Link>
        </div>
      </div>

      {/* Product Content */}
      <section className="px-6 lg:px-12 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Product Image */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="lg:sticky lg:top-32 lg:self-start"
            >
              <div className="aspect-square bg-card border border-border overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  data-testid="product-image"
                />
              </div>
            </motion.div>

            {/* Product Details */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
                  {product.category}
                </p>
                <h1 className="font-serif text-3xl lg:text-4xl mb-4" data-testid="product-name">
                  {product.name}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {product.subtitle}
                </p>
              </div>

              <div className="flex items-baseline gap-4">
                <p className="font-serif text-3xl" data-testid="product-price">
                  €{product.price.toFixed(2).replace('.', ',')}
                </p>
                <span className="text-sm text-muted-foreground">incl. BTW</span>
              </div>

              <div className="h-px bg-border"></div>

              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Quantity & Add to Cart */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-6">
                  <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Aantal
                  </span>
                  <div className="flex items-center border border-border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-4 hover:bg-muted transition-colors"
                      data-testid="decrease-quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-8 py-4 min-w-[80px] text-center font-medium" data-testid="quantity-display">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-4 hover:bg-muted transition-colors"
                      data-testid="increase-quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-500 uppercase tracking-[0.2em] text-xs px-10 py-6 rounded-none w-full"
                  data-testid="add-to-cart-button"
                >
                  {adding ? 'Toevoegen...' : 'Toevoegen aan winkelwagen'}
                </Button>

                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <span>Gratis verzending vanaf €50</span>
                  <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                  <span>Veilig betalen</span>
                </div>
              </div>

              <div className="h-px bg-border"></div>

              {/* Benefits */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-6">Voordelen</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <div className="w-5 h-5 border border-primary rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="h-px bg-border"></div>

              {/* Ingredients */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-4">Ingrediënten</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.ingredients.join(' · ')}
                </p>
              </div>

              <div className="h-px bg-border"></div>

              {/* Usage */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-4">Gebruiksaanwijzing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.usage}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
