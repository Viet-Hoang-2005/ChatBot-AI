import { useNavigate, useLocation } from "react-router-dom";
import logoImg from "../assets/logo.png";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "HOME" },
    { path: "/about", label: "ABOUT US" },
    { path: "/support", label: "SERVICE & SUPPORT" },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="relative z-10">
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-5">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl px-5 py-3">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center hover:opacity-80 transition"
          >
            <img
              src={logoImg}
              alt="Logo"
              className="h-6 w-auto object-contain"
            />
          </button>

          {/* Navigation Menu */}
          <nav className="flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative group"
              >
                <span
                  className={`text-sm font-semibold transition-colors ${
                    isActive(item.path)
                      ? "text-pink-400"
                      : "text-white hover:text-pink-400"
                  }`}
                >
                  {item.label}
                </span>
                
                {/* Underline indicator */}
                <span
                  className={`absolute left-0 right-0 -bottom-2 h-0.5 bg-pink-400 transition-all duration-300 ${
                    isActive(item.path)
                      ? "opacity-100 scale-x-100"
                      : "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100"
                  }`}
                />
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}