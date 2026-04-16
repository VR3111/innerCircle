import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <div className="size-full bg-[#0A0A0A]">
      <RouterProvider router={router} />
    </div>
  );
}