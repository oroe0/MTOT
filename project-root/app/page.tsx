import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-green-400 via-slate-400 to-slate-300 text-black">
      
      {/* Top bar with logo and buttons */}
      <div className="flex justify-between items-center px-6 py-4 bg-white/90 shadow">
        {/* Logo placeholder */}
        <img src="/large-logo.png" className="w-12 h-12 rounded-full justify-center" />

        {/* Sign in / Register buttons */}
        <div className="space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-500 rounded-full text-white font-semibold hover:bg-blue-400 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-purple-600 rounded-full text-white font-semibold hover:bg-purple-500 transition"
          >
            Register
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center text-center p-8 space-y-6">
        {/* Title */}
        <h1 className="text-4xl font-bold font-oldenburg">Mock Trial Online Trainer</h1>
        <p className="text-lg italic font-oldenburg font-bold">Built for For Highschool Mock Trial!</p>

        {/* Main image */}
        <div className="flex flex-row">
          <img src={"2023-High-School-Mock-Trial.jpg"} className="h-100 rounded-md shadow m-9"/>
          <img src={"2023-High-School-Mock-Trial.jpg"} className="h-100 rounded-md shadow m-9"/>{/** This will store an image of the chats */}
        </div>
        

        {/* Purpose section */}
        <div className="w-3/4 md:w-1/2 bg-slate-400 rounded-2xl shadow p-4 text-left font-oldenburg">
          <h2 className="text-2xl font-bold mb-2">Purpose</h2>
          <p>
            The Mock Trial Online Trainer was designed to help give quick and easy
            extra practice outside of the courtroom to anyone practicing for a
            Mock Trial.
          </p>
          <p>
            It was specifically designed based on the requirements for High School Mock Trial, 
            but it should still be suffecient practice for college level Mock Trial.
          </p>
        </div>


        {/* Bullet points */}
        <div className="w-3/4 md:w-1/2 bg-slate-400 rounded-2xl shadow p-4 text-left">
          <ul className="space-y-2 font-oldenburg">
            <li>- Practice for any role with custom trials</li>
            <li>- Get practice in at anytime</li>
            <li>- Debate in real time</li>
            <li>- Save your cases for later</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
