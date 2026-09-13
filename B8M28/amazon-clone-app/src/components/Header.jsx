import amazonlogo from "../assets/amazon logo.png";
import { MapPin, Search, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useState } from "react";
import Toast from "./Toast";

export default function Header({ onGoToCart }) {
  const { totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-40 bg-[#0f1111] text-white px-4 py-1 flex items-center justify-between gap-2 text-sm shadow-md">
      <a href="#" className="flex items-center  p-3 rounded">
        <img
          src={amazonlogo}
          alt="Amazon Logo"
          className="h-10  w-auto object-contain"
        />
      </a>

      <div className="hidden md:flex items-center space-x-1 cursor-pointer  p-1 ">
        <MapPin className="w-5 h-5 text-gray-300 " />
        <div className="flex flex-col text-xs leading-tight">
          <span className="text-white text-1xl">Deliver to</span>
          <span className="font-bold text-white text-2xl">Bangladesh</span>
        </div>
      </div>

      <div className="flex-1 max-w-5xl hidden sm:flex items-center rounded-md overflow-hidden py-5">
        <input
          type="text"
          placeholder="Search Amazon"
          className="w-full h-14 px-3 py-2 text-black bg-white outline-none placeholder-gray-500 text-2xl"
        />
        <button className="bg-white h-14 px-4 text-gray-500 transition-colors flex items-center justify-center shrink-0">
          <Search className="w-7 h-7 text-gray-500" />
        </button>
      </div>

      <div className="hidden lg:flex items-center space-x-4">
        <button className="text-left flex flex-col text-xs leading-tight cursor-pointer">
          <span className="text-gray-300 text-1xl">Hello, sign in</span>
          <span className="font-bold text-white text-2xl">Account & Lists</span>
        </button>

        <button className="text-left flex flex-col text-xs leading-tight cursor-pointer">
          <span className="text-gray-300 text-1xl">Returns</span>
          <span className="font-bold text-white text-2xl">& Orders</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        aria-label="Open cart"
        className="relative flex items-center space-x-1 cursor-pointer"
      >
        <div className="relative">
          <ShoppingCart className="w-12 h-12 text-white" />
          {totalItems > 0 && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f08804] text-slate-900 font-extrabold text-1xl px-2.5 py-0.5 rounded-full">
              {totalItems}
            </span>
          )}
        </div>
        <span className="font-bold text-2xl hidden sm:inline self-end mb-1">
          Cart
        </span>
      </button>
      </nav>
      <Toast
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onGoToCart={() => {
          setIsCartOpen(false);
          onGoToCart();
        }}
      />
    </>
  );
}
