"use client";

import { useState } from "react";
import { loginAdmin } from "./actions";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await loginAdmin(password);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      window.location.href = "/admin";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest text-cream font-sans">
      <div className="bg-white text-forest p-10 max-w-sm w-full shadow-2xl">
        <h2 className="text-2xl font-serif mb-6 text-center">Admin Access</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold"
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-light text-forest py-3 uppercase tracking-widest font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
