import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { useCart } from '../context/CartContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CartPage() {
  const { cart, cartId, updateQuantity, removeFromCart, loading } = useCart();

  const handleCheckout = async () => {
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/checkout`, {
        cart_id: cartId,
        origin_url: originUrl
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen pt-20" data-testid="cart-page-empty">
        <div className="px-6 lg:px-12 py-24">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-8">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <h1 className="font-serif text-3xl mb-4">Je winkelwagen is leeg</h1>
              <p className="text-muted-foreground mb-8">
                Ontdek onze collectie natuurlijke balsems en voeg je favorieten toe.
              </p>
              <Link to="/shop" data-testid="continue-shopping-empty">
                <Button className="btn-primary rounded-sm">
                  Bekijk producten
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20" data-testid="cart-page">
      {/* Header */}
      <section className="px-6 lg:px-12 py-12 lg:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-3xl lg:text-4xl"
          >
            Winkelwagen
          </motion.h1>
        </div>
      </section>

      {/* Cart Content */}
      <section className="px-6 lg:px-12 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.items.map((item, index) => (
                <motion.div
                  key={item.product_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6 pb-6 border-b border-border"
                  data-testid={`cart-item-${item.product_id}`}
                >
                  {/* Product Image */}
                  <Link 
                    to={`/product/${item.product_id}`}
                    className="w-24 h-24 md:w-32 md:h-32 bg-card border border-border overflow-hidden flex-shrink-0"
                  >
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <Link 
                        to={`/product/${item.product_id}`}
                        className="font-serif text-lg hover:opacity-70 transition-opacity"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        €{item.product.price.toFixed(2).replace('.', ',')} per stuk
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          disabled={loading}
                          className="p-2 hover:bg-muted transition-colors"
                          data-testid={`decrease-${item.product_id}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-4 py-2 min-w-[40px] text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={loading}
                          className="p-2 hover:bg-muted transition-colors"
                          data-testid={`increase-${item.product_id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        disabled={loading}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        data-testid={`remove-${item.product_id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-medium">
                      €{item.item_total.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Continue Shopping */}
              <Link 
                to="/shop"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="continue-shopping"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Verder winkelen
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-muted/50 border border-border p-6 lg:p-8 lg:sticky lg:top-32"
              >
                <h2 className="font-serif text-xl mb-6">Overzicht</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotaal</span>
                    <span>€{cart.total.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Verzendkosten</span>
                    <span>{cart.total >= 50 ? 'Gratis' : '€4,95'}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between font-medium">
                    <span>Totaal</span>
                    <span data-testid="cart-total">
                      €{(cart.total + (cart.total >= 50 ? 0 : 4.95)).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Inclusief BTW
                  </p>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="btn-primary rounded-sm w-full"
                  data-testid="checkout-button"
                >
                  Afrekenen
                </Button>

                {cart.total < 50 && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Nog €{(50 - cart.total).toFixed(2).replace('.', ',')} tot gratis verzending
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
