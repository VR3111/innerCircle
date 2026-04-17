import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { Toaster } from "sonner";

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <div className="size-full bg-[#0A0A0A]">
          <RouterProvider router={router} />
          <Toaster
            theme="dark"
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#1A1A1A",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "14px",
              },
            }}
          />
        </div>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
