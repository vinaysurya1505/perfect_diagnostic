"use client";
import { useEffect } from "react";
import Image from 'next/image';

export default function AdminDashboard() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggedIn = localStorage.getItem("isAdminLoggedIn");
      if (!isLoggedIn) {
        window.location.href = "/login";
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-white font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-md">
        <div className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="Logo" width={48} height={48} className="rounded-full border-2 border-teal-500" />
          <span className="text-2xl font-bold text-teal-700 ml-2">Welcome back, Admin!</span>
        </div>
        <div className="flex gap-3">
          <a href="/billing" className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition">Billing</a>
          <a href="/tests" className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition">Test Management</a>
          <a href="/doctors" className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition">Doctor</a>
          <button
            onClick={handleLogout}
            className="px-6 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center mt-20">
        <div className="bg-white rounded-2xl shadow-xl p-12 flex flex-col items-center max-w-lg w-full border border-teal-100">
          <h1 className="mb-4 font-extrabold text-3xl text-teal-700 text-center tracking-tight">Welcome, Admin!</h1>
          <p className="text-gray-600 text-center mb-8 text-lg">Manage all your operations from here: add doctors, tests, and create bills.</p>
          <div className="flex flex-col gap-4 w-full">
            <a href="/tests" className="block py-4 rounded-lg bg-teal-50 text-teal-700 text-center font-semibold text-lg shadow hover:bg-teal-100 transition">Test Management</a>
            <a href="/doctors" className="block py-4 rounded-lg bg-teal-50 text-teal-700 text-center font-semibold text-lg shadow hover:bg-teal-100 transition">Doctor Management</a>
            <a href="/billing" className="block py-4 rounded-lg bg-teal-50 text-teal-700 text-center font-semibold text-lg shadow hover:bg-teal-100 transition">Billing</a>
          </div>
        </div>
      </div>
    </div>
  );
}
