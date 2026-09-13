import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import emptyCart from "../assets/empty-cart.webp"

export default function ShoppingCart({ onGoToShop }) {
  const {
    cartItems,
    addToCart,
    removeFromCart,
    removeItem,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");

  useEffect(() => {
    if (!promoMessage) return undefined;

    const timeoutId = setTimeout(() => {
      setPromoMessage("");
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [promoMessage]);

  const applyPromoCode = () => {
    setPromoMessage("Invalid promo code!");
  };

  return (
    <div className="min-h-screen bg-[#eaeded] px-3 py-6 sm:px-6 lg:px-8">
      {promoMessage && (
        <div className="fixed left-1/2 top-24 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-md bg-[#ef4b3d] px-5 py-4 text-white shadow-lg">
          <p className="text-lg font-semibold"> &nbsp; {promoMessage}</p>
          <button
            type="button"
            onClick={() => setPromoMessage("")}
            aria-label="Close notification"
            className="text-2xl leading-none opacity-90 hover:opacity-100"
          >
            &times;
          </button>
        </div>
      )}

      <div className="mx-auto grid max-w-375 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(320px,1fr)]">
        <section className="bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-6">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Shopping Cart</h1>
            <button
              type="button"
              onClick={clearCart}
              disabled={!cartItems.length}
              className="bg-[#ff5964] px-4 py-3 font-bold text-white transition hover:bg-[#e94854] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
            >
              Clear Cart
            </button>
          </div>

          {cartItems.length === 0 ? (
            <div className="flex min-h-115 flex-col items-center justify-center px-5 py-16 text-center">
              {/* <ShoppingCartIcon className="h-48 w-48 text-cyan-400" strokeWidth={1.2} /> */}
              <img src={emptyCart} className="h-50 w-90"  alt="" />
              <h2 className="mt-6 text-3xl font-medium text-slate-900">Your Cart is Empty</h2>
              <button
                type="button"
                onClick={onGoToShop}
                className="mt-7 border border-slate-700 px-6 py-4 text-lg font-bold text-slate-900 transition hover:bg-slate-100"
              >
                Go to Shop
              </button>
            </div>
          ) : (
            <div className="mt-7 overflow-x-auto">
              <div className="min-w-190 border border-gray-200">
                <div className="grid grid-cols-[1.1fr_2fr_0.8fr_1fr_0.8fr_0.8fr] border-b border-gray-200 text-sm font-semibold uppercase text-slate-500">
                  <div className="p-4">Image</div>
                  <div className="p-4">Product</div>
                  <div className="p-4">Unit Price</div>
                  <div className="p-4">Quantity</div>
                  <div className="p-4">Total</div>
                  <div className="p-4">Remove</div>
                </div>
                {cartItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1.1fr_2fr_0.8fr_1fr_0.8fr_0.8fr] items-center text-slate-800">
                    <div className="p-4">
                      <div className="flex h-44 items-center justify-center bg-gray-50 p-2">
                        <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                      </div>
                    </div>
                    <p className="p-4 font-semibold">{item.name}</p>
                    <p className="p-4 font-semibold">${item.price.toFixed(2)}</p>
                    <div className="p-4">
                      <div className="flex w-fit items-center border border-gray-200">
                        <button type="button" onClick={() => removeFromCart(item.id)} aria-label="Decrease quantity" className="border-r border-gray-200 px-4 py-3 hover:bg-gray-100">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-5 py-3">{item.quantity}</span>
                        <button type="button" onClick={() => addToCart(item)} aria-label="Increase quantity" className="border-l border-gray-200 px-4 py-3 hover:bg-gray-100">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="p-4 font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    <button type="button" onClick={() => removeItem(item.id)} className="p-4 text-left font-semibold hover:text-red-600">
                      <Trash2 className="h-5 w-5" />
                      <span className="sr-only">Remove {item.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit bg-white p-6 text-lg text-slate-900">
          <p className="flex justify-between gap-4">Subtotal (before discount): <strong>${totalPrice.toFixed(2)}</strong></p>
          <p className="mt-5 flex justify-between gap-4">Discount: <strong>$0.00</strong></p>
          <p className="mt-5 flex justify-between gap-4 text-xl">Total ({totalItems} items): <strong>${totalPrice.toFixed(2)}</strong></p>
          <input
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            placeholder="Enter Promo Code"
            className="mt-6 w-full rounded-md border border-gray-300 px-5 py-4 outline-none placeholder:text-gray-400 focus:border-indigo-500"
          />
          <button type="button" onClick={applyPromoCode} className="mt-4 w-full bg-[#4d00ff] px-5 py-4 font-bold text-white transition hover:bg-[#3b00c7]">
            Apply Promo Code
          </button>
          <button type="button" className="mt-4 w-full bg-[#ffbd00] px-5 py-4 font-bold text-slate-950 transition hover:bg-[#e8a900]">
            Proceed to checkout
          </button>
        </aside>
      </div>
    </div>
  );
}
