

import Image from "next/image"
import Link from "next/link"


export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-yellow-200 via-stone-400 to-blue-900 text-gray-900 font-petrona">
      
      {/* Top bar with logo and buttons */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/80 shadow-md backdrop-blur">
        {/* Logo placeholder */}
        <div className="flex items-center space-x-2">
          <img src="large-logo.png" className="w-12 h-12 flex items-center justify-center" />
          <span className="pl-3 font-bold font-oldenburg text-lg text-blue-900">Mock Trial Online Trainer</span>
        </div>

        {/* Sign in / Register buttons */}
        <div className="space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-700 rounded-full text-white font-semibold hover:bg-blue-600 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-yellow-400 rounded-full text-black font-semibold hover:bg-yellow-300 transition"
          >
            Register
          </Link>
        </div>
      </header>


      {/* Hero Section */}
      <section className="flex flex-col items-center text-center p-12 pt-28 shadow-inner">
        <h1 className="text-5xl font-bold font-oldenburg text-blue-950 mb-4">
          Mock Trial Online Trainer
        </h1>
        <p className="text-lg italic font-oldenburg text-stone-700 mb-8">
          Built for Highschool Mock Trial and beyond!
        </p>

        {/* Hero Images */}
        <div className="flex flex-col md:flex-row gap-6">
          <img src="2023-High-School-Mock-Trial.jpg" className="w-150 h-100 bg-gray-300 rounded-lg shadow flex items-center justify-center" />
          <img src="testingImage.png" className="w-150 h-100 bg-gray-400 rounded-lg shadow flex items-center justify-center" />
        </div>
      </section>

      {/* Features Section */}
      <section className="flex flex-col items-center py-12 px-6 space-y-8">
        <h2 className="text-3xl font-bold text-blue-950 mb-4 font-oldenburg">Why should you use the MTOT?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full bg-zinc-200 rounded-3xl font-oldenburg m-2 p-4">
          <div className="bg-gradient-to-l from-stone-100 to-sky-100 rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">Choose Your Role</h3>
            <p className="text-gray-700">
              Practice for any role, whether you’re an attorney or witness,
              with custom trials tailored to your needs.
            </p>
          </div>
          <div className="bg-gradient-to-r from-slate-100 to-amber-100 rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">Access Anytime</h3>
            <p className="text-gray-700">
              Get practice whenever you want. The MTOT is available 24/7 so you can get practice when you need it.
            </p>
          </div>
          <div className="bg-gradient-to-l from-stone-100 to-sky-200 rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">Real Time Debating</h3>
            <p className="text-gray-700">
              Litigate and argue cases in real time, it is perfect for sharpening your writing and questioning skills.
            </p>
          </div>
          <div className="bg-gradient-to-r from-slate-100 to-amber-200 rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">Save Your Cases</h3>
            <p className="text-gray-700">
              Store cases to revisit at a later time, and review old cases to find areas of improvement.
            </p>
          </div>
        </div>
      </section>

      {/* Purpose Section */}
      <section className="flex flex-col items-center py-12 px-6">
        <div className="max-w-3xl bg-zinc-200 rounded-3xl shadow-lg p-8 text-left font-oldenburg">
          <h2 className="text-3xl font-bold mb-4 text-blue-900">Purpose</h2>
          <p className="text-stone-700 mb-4">
            The Mock Trial Online Trainer was designed to provide quick and effective practice 
            outside of the courtroom for students and aspiring lawyers alike.
          </p>
          <p className="text-stone-700">
            Although it was originally tailored for High School Mock Trial competitions, the MTOT is equally 
            useful for college students and anyone interested in improving their argumentation skills.
          </p>
        </div>
      </section>

      {/* Testimonials / Extra Content */}
      <section className="flex flex-col items-center py-12 px-6 font-oldenburg">
        <h2 className="text-3xl font-bold text-blue-900 mb-6">What People Are Saying</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          <div className="bg-zinc-100 rounded-xl shadow p-6">
            <p className="italic">“Here at punsmocktrial we not only win cases as a team, we gain weight as a team. The MTOT helps our team live a more sedentary lifestyle.”</p>
            <p className="mt-4 font-semibold text-blue-700">— Champions of the Courtroom</p>
          </div>
          <div className="bg-zinc-100 rounded-xl shadow p-6">
            <p className="italic">“The only downside to the MTOT is that I cannot win any of these online trials! The MTOT bot is just way better than me as a lawyer!”</p>
            <p className="mt-4 font-semibold text-blue-700">— Professional Attorney</p>
          </div>
          <div className="bg-zinc-100 rounded-xl shadow p-6">
            <p className="italic">“My team improved dramatically thanks to this tool. I am now able to sleep well at night, and don't have to snore during their competitions!”</p>
            <p className="mt-4 font-semibold text-blue-700">— R. Lau</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-6 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 max-w-6xl mx-auto">
          <p>&copy; {new Date().getFullYear()} Mock Trial Online Trainer. All rights reserved.</p>
          
          {/*<div className="flex space-x-4 mt-3 md:mt-0">
            <Link href="/about" className="hover:text-yellow-400 transition">About</Link>
            <Link href="oroe28@punahou.edu" className="hover:text-yellow-400 transition">Email</Link>
            <Link href="/faq" className="hover:text-yellow-400 transition">FAQ</Link>
          </div>*/}
        </div>
      </footer>
    </div>
  )
}
