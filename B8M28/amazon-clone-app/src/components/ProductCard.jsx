import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import gamingpc1 from "../assets/products/gaming-pc-1.png";
import gamingpc2 from "../assets/products/gaming-pc-2.png";
import gamingpc3 from "../assets/products/gaming-pc-3.png";
import gamingpc4 from "../assets/products/gaming-pc-4.png";
import gamingpc5 from "../assets/products/gaming-pc-5.png";
import gamingpc6 from "../assets/products/gaming-pc-6.png";
import { useCart } from "../context/CartContext";

export default function ProductCard() {
  const { addToCart } = useCart();

  const [addCartMessage, setAddCartMessage] = useState("");

  useEffect(() => {
    if (!addCartMessage) return undefined;

    const timeoutId = setTimeout(() => {
      setAddCartMessage("");
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [addCartMessage]);

  const showCartMessage = () => {
    setAddCartMessage("Item has been successfully added to your Cart");
  };

  const products = [
    {
      id: 1,
      name: "Skytech Gaming Nebula Gaming PC Desktop, Intel Core i5 13400F 2.5 GHz, NVIDIA RTX 4060, 1TB NVME SSD, 16GB DDR4 RAM 3200, 600W Gold PSU, 11AC Wi-Fi, Windows 11 Home 64-bit",
      price: 849.99,
      image: gamingpc1,
    },
    {
      id: 2,
      name: "CyberPowerPC Gamer Master Gaming PC, AMD Ryzen 5 5500 3.6GHz, Radeon RX 6400 4GB, 500GB PCIe Gen4 SSD, 16GB DDR4, undefined, WiFi Ready, Windows 11 Home (GMA3100A)",
      price: 649.99,
      image: gamingpc2,
    },
    {
      id: 3,
      name: "iBUYPOWER Y60 Black Gaming PC, AMD Ryzen 9 7900X, NVIDIA GeForce RTX 4070 Ti Super 16GB, 2TB NVMe, 32GB DDR5 RGB 5200MHz, undefined, WiFi Ready, Windows 11 Home Advanced",
      price: 1899.99,
      image: gamingpc3,
    },
    {
      id: 4,
      name: "CyberPowerPC Gamer Xtreme VR Gaming PC, Intel Core i9-13900KF 3.0GHz, GeForce RTX 4070 12GB, 1TB NVMe SSD, 16GB DDR5, undefined, Wi-Fi Ready, Windows 11 Home (GXiVR8080A36)",
      price: 2202.63,
      image: gamingpc4,
    },
    {
      id: 5,
      name: "Thermaltake LCGS Quartz i460 R4 Gaming Desktop, Intel Core i5-13400F, NVIDIA GeForce RTX 4060, 1TB NVMe M.2, 16GB RGB Memory, undefined, undefined, undefined",
      price: 880,
      image: gamingpc4,
    },
    {
      id: 6,
      name: "Skytech Gaming Nebula Gaming PC Desktop, Intel Core i5 13400F 2.5 GHz, NVIDIA RTX 4060, 1TB NVME SSD, 16GB DDR4 RAM 3200, 600W Gold PSU, 11AC Wi-Fi, Windows 11 Home 64-bit",
      price: 849.99,
      image: gamingpc5,
    },
    {
      id: 7,
      name: "iBUYPOWER Trace Mesh Gaming PC Computer Desktop, Intel Core i7 14700F, NVIDIA GeForce RTX 4060 Ti 8GB, 1TB NVMe SSD, 32GB DDR5 5600 RGB, undefined, WiFi Ready, Windows 11 Home",
      price: 849.99,
      image: gamingpc6,
    },
  ];

  return (
    <div className="flex flex-col my-5">
      {addCartMessage && (
        <div className="fixed left-1/2 top-24 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-4 rounded-md bg-[#00bd08] px-5 py-4 text-white shadow-lg">
          <Check className="mt-1 h-7 w-7 shrink-0 rounded-full border-2 border-white p-1" />
          <p className="flex-1 text-xl font-medium leading-tight">
            Item has been successfully added to your cart!
          </p>
          <button
            type="button"
            onClick={() => setAddCartMessage("")}
            aria-label="Close notification"
            className="opacity-90 transition hover:opacity-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
      {products.map((product) => (
        <div
          key={product.id}
          className="max-w-4xl w-full h-130 md:h-90 mx-auto my-4 bg-white rounded-lg overflow-hidden shadow-sm flex flex-col md:flex-row items-center"
        >
          <div className="w-full h-80 md:h-auto md:self-stretch md:w-1/3 bg-[#f2f2f2] p-6 flex justify-center items-center shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="h-64 md:h-72 w-auto object-contain hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="w-full md:w-2/3 h-full min-h-0 p-6 flex flex-col justify-between space-y-3">
            <h1 className="flex-1 min-h-0 overflow-y-auto text-xl md:text-2xl font-semibold text-slate-900 leading-snug">
              {product.name}
            </h1>

            <div className="space-y-1">
              <h2 className="text-3xl font-bold text-slate-900">
                ${product.price}
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Sold by Amazon
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  addToCart(product);
                  showCartMessage();
                }}
                className="bg-[#ffbe00] border border-[#ffbe00] hover:bg-[#f3a847] text-slate-900 text-1xl font-bold px-6 py-2 rounded-full shadow-sm hover:shadow transition-all duration-150 active:scale-95"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
