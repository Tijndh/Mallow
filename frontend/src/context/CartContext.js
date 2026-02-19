import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartId, setCartId] = useState(null);
  const [cart, setCart] = useState({ items: [], total: 0, item_count: 0 });
  const [loading, setLoading] = useState(false);

  // Initialize cart
  useEffect(() => {
    const initCart = async () => {
      const storedCartId = localStorage.getItem('mallow_cart_id');
      if (storedCartId) {
        try {
          const response = await axios.get(`${API}/cart/${storedCartId}`);
          setCartId(storedCartId);
          setCart(response.data);
        } catch (e) {
          // Cart not found, create new one
          createNewCart();
        }
      } else {
        createNewCart();
      }
    };

    const createNewCart = async () => {
      try {
        const response = await axios.post(`${API}/cart`);
        setCartId(response.data.id);
        localStorage.setItem('mallow_cart_id', response.data.id);
        setCart({ items: [], total: 0, item_count: 0 });
      } catch (e) {
        console.error('Error creating cart:', e);
      }
    };

    initCart();
  }, []);

  const refreshCart = async () => {
    if (!cartId) return;
    try {
      const response = await axios.get(`${API}/cart/${cartId}`);
      setCart(response.data);
    } catch (e) {
      console.error('Error refreshing cart:', e);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!cartId) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API}/cart/${cartId}/items`, {
        product_id: productId,
        quantity: quantity
      });
      setCart(response.data);
      return true;
    } catch (e) {
      console.error('Error adding to cart:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!cartId) return;
    setLoading(true);
    try {
      const response = await axios.put(`${API}/cart/${cartId}/items/${productId}?quantity=${quantity}`);
      setCart(response.data);
    } catch (e) {
      console.error('Error updating cart:', e);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    if (!cartId) return;
    setLoading(true);
    try {
      const response = await axios.delete(`${API}/cart/${cartId}/items/${productId}`);
      setCart(response.data);
    } catch (e) {
      console.error('Error removing from cart:', e);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setCart({ items: [], total: 0, item_count: 0 });
  };

  return (
    <CartContext.Provider value={{
      cartId,
      cart,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      refreshCart,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
