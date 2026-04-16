import { Home, TrendingUp, Compass, User } from "lucide-react";
import { Link, useLocation } from "react-router";

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/10 pb-safe">
      <div className="max-w-[375px] mx-auto flex justify-around items-center h-16 px-6">
        <Link to="/" className="p-3">
          <Home
            size={24}
            strokeWidth={1.5}
            className={isActive("/") ? "text-white" : "text-white/40"}
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
        <Link to="/profile" className="p-3">
          <User
            size={24}
            strokeWidth={1.5}
            className={isActive("/profile") ? "text-white" : "text-white/40"}
          />
        </Link>
      </div>
    </nav>
  );
}
