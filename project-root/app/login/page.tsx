// -------------------------
// This page lets existing users log into their account
// -------------------------
'use client'

import { useState } from "react"; // for storing what the user types
import { signInWithEmailAndPassword } from "firebase/auth"; // Firebase login function
import { auth } from "@/firebase"; // our Firebase Auth instance
import { useRouter } from "next/navigation"; // for redirecting
import Link from "next/link";

export default function Login() {
  const router = useRouter();

  // Store form input
  const [email, setEmail] = useState("");       
  const [password, setPassword] = useState(""); 
  const [message, setMessage] = useState("");   

  // Runs when user clicks "Login"
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // stop refresh
    try {
      // Try to log the user in
      await signInWithEmailAndPassword(auth, email, password);

      // Show success message
      setMessage("Login successful");

      // Redirect to protected page
      router.push("/protected");
    } catch (err) {
      if (err instanceof Error) {
        // Show error if login fails
        // handle known error type
        setMessage("Login failed, " + err.message)
      } else {
        // fallback for unexpected error shapes
        setMessage("Login failed due to an unknown error")
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-slate-800 via-sky-600 to-teal-200 text-white">
      <form onSubmit={handleLogin} className="bg-gray-800 p-6 rounded-lg shadow-lg w-80">
        <h1 className="text-xl font-bold mb-4 text-center">Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-500 transition"
        >
          Login
        </button>

        <Link href="/register" className="block mt-4 text-blue-400 hover:underline text-center">
          Go to Sign Up
        </Link>

        {message && <p className="mt-3 text-center">{message}</p>}
      </form>

      <div className="mt-9">
        <Link
          href="/"
          className="mt-4 px-4 py-2 bg-red-500 rounded text-white font-semibold hover:bg-red-400 transition"
        >
          Back
        </Link>
      </div>
    </div>
  );
}