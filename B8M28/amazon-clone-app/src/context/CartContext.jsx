// CartContext.js
import { createContext, useState, useContext, useMemo, useEffect } from 'react';

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  // 1. Initialize state. If there's data in localStorage, use it. Otherwise, use an empty array.
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('localCartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 2. Automatically save items to localStorage whenever 'cartItems' changes
  useEffect(() => {
    localStorage.setItem('localCartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // --- ACTIONS ---
  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === productId);
      if (existingItem?.quantity === 1) {
        return prevItems.filter((item) => item.id !== productId);
      }
      return prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const removeItem = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // --- CALCULATED VALUES ---
  const totalItems = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const totalPrice = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    removeItem,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
