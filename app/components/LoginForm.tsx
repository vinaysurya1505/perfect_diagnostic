"use client";
import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });
      const data = await res.json();
        if (data.success) {
          localStorage.setItem("isAdminLoggedIn", "true");
          window.location.href = "/admindashboard";
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-center text-teal-700 mb-2 text-2xl font-bold">Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="p-3 rounded-md border border-teal-200 text-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
        autoFocus
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="p-3 rounded-md border border-teal-200 text-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
      />
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="bg-teal-700 text-white rounded-md py-3 font-semibold text-lg mt-2 hover:bg-teal-800 transition disabled:opacity-60"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
