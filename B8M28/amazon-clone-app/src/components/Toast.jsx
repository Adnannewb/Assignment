import { ArrowRight, Minus, Plus, Trash2, X } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Toast({ isOpen, onClose, onGoToCart }) {
	const { cartItems, addToCart, removeFromCart, removeItem, totalPrice } = useCart();

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
			<button
				type="button"
				aria-label="Close cart"
				onClick={onClose}
				className="absolute inset-0 bg-black/40"
			/>

			<aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300">
				<div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 py-5">
					<div className="text-center flex-1">
						<h2 className="text-2xl font-bold text-slate-800">Sub Total</h2>
						<p className="mt-4 text-2xl font-bold text-[#c43216]">
							${totalPrice.toFixed(2)}
						</p>
						<button
							type="button"
							onClick={onGoToCart}
							className="mt-4 inline-flex w-full max-w-[264px] items-center justify-center gap-3 rounded-full border border-slate-700 px-5 py-2 text-lg text-slate-800 transition hover:bg-slate-100"
						>
							Go to Cart
							<ArrowRight className="h-6 w-6" />
						</button>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close cart"
						className="rounded p-1 text-slate-800 transition hover:bg-slate-100"
					>
						<X className="h-8 w-8" />
					</button>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto">
					{cartItems.length === 0 ? (
						<p className="px-6 py-12 text-center text-lg text-slate-500">
							Your cart is empty.
						</p>
					) : (
						cartItems.map((item) => (
							<article key={item.id} className="border-b-8 border-gray-200">
								<div className="flex h-52 items-center justify-center bg-gray-50 px-6 py-4">
									<img
										src={item.image}
										alt={item.name}
										className="h-full w-full object-contain"
									/>
								</div>
								<div className="px-6 py-3">
									<p className="line-clamp-2 text-center text-xl font-bold text-slate-800">
										${(item.price * item.quantity).toFixed(2)}
									</p>
									<div className="mt-4 flex items-center justify-between">
										<div className="flex items-center border border-gray-200">
											<button
												type="button"
												onClick={() => removeFromCart(item.id)}
												aria-label={`Decrease ${item.name} quantity`}
												className="p-2 text-slate-700 transition hover:bg-gray-100"
											>
												<Minus className="h-5 w-5" />
											</button>
											<span className="border-x border-gray-200 px-6 py-2 text-lg text-slate-800">
												{item.quantity}
											</span>
											<button
												type="button"
												onClick={() => addToCart(item)}
												aria-label={`Increase ${item.name} quantity`}
												className="p-2 text-slate-700 transition hover:bg-gray-100"
											>
												<Plus className="h-5 w-5" />
											</button>
										</div>
										<button
											type="button"
											onClick={() => removeItem(item.id)}
											aria-label={`Remove ${item.name}`}
											className="rounded p-2 text-slate-800 transition hover:bg-red-50 hover:text-red-700"
										>
											<Trash2 className="h-7 w-7" />
										</button>
									</div>
								</div>
							</article>
						))
					)}
				</div>
			</aside>
		</div>
	);
}
