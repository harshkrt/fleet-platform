import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS_BY_ROLE = {
  CUSTOMER: [
    { to: "/customer/book", label: "Book a ride" },
    { to: "/customer/rides", label: "My rides" },
  ],
  DRIVER: [
    { to: "/driver/available", label: "Available rides" },
    { to: "/driver/assigned", label: "My rides" },
  ],
  ADMIN: [{ to: "/admin", label: "Dashboard" }],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-gray-900">Fleet</span>
          <div className="flex gap-4 text-sm">
            {LINKS_BY_ROLE[user.role]?.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? "font-medium text-gray-900" : "text-gray-500 hover:text-gray-800"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>
            {user.name} <span className="text-gray-400">({user.role})</span>
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
