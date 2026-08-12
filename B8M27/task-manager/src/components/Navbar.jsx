import { NavLink } from "react-router-dom";
import { useContext } from "react";

import { ThemeContext } from "../context/ThemeContext";

function Navbar() {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <nav className="navbar">
      <div className="navbar-title">
        <h2>Task Manager</h2>
      </div>

      <div className="nav-links">
        <NavLink to="/">Home</NavLink>

        <NavLink to="/about">About</NavLink>

        <button onClick={toggleTheme}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;