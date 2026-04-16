import { Link, useRouteError } from "react-router";

export default function ErrorBoundary() {
  const error = useRouteError() as { statusText?: string; message?: string };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-[#E63946]/20 flex items-center justify-center mx-auto mb-6">
          <span className="font-['Outfit'] font-bold text-[#E63946] text-4xl">!</span>
        </div>
        <h1 className="font-['Outfit'] font-bold text-white text-2xl mb-2">
          Something went wrong
        </h1>
        <p className="font-['DM_Sans'] text-white/60 text-sm mb-8">
          {error?.statusText || error?.message || "An unexpected error occurred"}
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-full bg-white text-black font-['Outfit'] font-semibold hover:scale-105 transition-transform"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
