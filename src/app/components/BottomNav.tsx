import { Home, TrendingUp, Compass, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "";
  const initial = username.charAt(0).toUpperCase();
  const profileActive = isActive("/profile");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/10 pb-safe">
      <div className="max-w-[375px] mx-auto flex justify-around items-center h-16 px-6">
        <Link
          to="/home"
          className="p-3"
          onClick={(e) => {
            if (location.pathname === "/home") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              navigate("/home");
            }
          }}
        >
          <Home
            size={24}
            strokeWidth={1.5}
            className={isActive("/home") ? "text-white" : "text-white/40"}
          />
        </Link>
        <Link to="/leaderboard" className="p-3">
          <TrendingUp
            size={24}
            strokeWidth={1.5}
            className={isActive("/leaderboard") ? "text-white" : "text-white/40"}
          />
        </Link>
        <Link to="/explore" className="p-3">
          <Compass
            size={24}
            strokeWidth={1.5}
            className={isActive("/explore") ? "text-white" : "text-white/40"}
          />
        </Link>
        <Link to="/profile" className="p-3 flex items-center justify-center">
          {user && initial ? (
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-['Outfit'] font-bold text-[11px] transition-all ${
                profileActive
                  ? "bg-[#2A9D8F] text-white ring-2 ring-[#2A9D8F]/40"
                  : "bg-[#2A9D8F]/20 text-[#2A9D8F]"
              }`}
            >
              {initial}
            </div>
          ) : (
            <User
              size={24}
              strokeWidth={1.5}
              className={profileActive ? "text-white" : "text-white/40"}
            />
          )}
        </Link>
      </div>
    </nav>
  );
}
