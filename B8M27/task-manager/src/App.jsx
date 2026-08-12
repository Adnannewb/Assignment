import { useContext } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";

import { ThemeContext } from "./context/ThemeContext";

import "./App.css";

function App() {
  const { darkMode } = useContext(ThemeContext);

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;