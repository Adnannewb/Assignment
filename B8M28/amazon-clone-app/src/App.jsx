import Footer from "./components/Footer"
import Header from "./components/Header"
import ResultsPage from "./components/ResultsPage"
import ShoppingCart from "./components/ShoppingCart"
import { useState } from "react"

function App() {
  const [page, setPage] = useState("products")

  return (
    <>
      <Header onGoToCart={() => setPage("cart")} />
      <main className="pt-20">
        {page === "cart" ? <ShoppingCart onGoToShop={() => setPage("products")} /> : <ResultsPage />}
      </main>
      <Footer/>
    </>
  )
}

export default App
