import ProductCard from "./ProductCard";

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      
      <div className="max-w-4xl mx-auto my-5 space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Results</h1>
        <p className="text-gray-950 text-1xl">
          Check each product page for other buying options.
        </p>

        <div className="pt-2">
          <ProductCard />
        </div>
      </div>
    </div>
  );
}