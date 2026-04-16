import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import AppErrorBoundary from "./components/AppErrorBoundary";

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <div className="size-full bg-[#0A0A0A]">
          <RouterProvider router={router} />
        </div>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
