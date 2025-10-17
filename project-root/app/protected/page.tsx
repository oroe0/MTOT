'use client'

import { useEffect, useState } from 'react';
import axios from 'axios';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


export default function Protected() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push('/login');
      else setUser(currentUser);
    });
    return () => unsubscribe();
  }, [router]);



    return (
        <div className="min-h-screen bg-gradient-to-r from-yellow-200 via-stone-400 to-blue-900 text-gray-900 font-petrona">
            {/* Fixed Top Bar */}
            <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/80 shadow-md backdrop-blur">
                {/* Logo */}
                <a href="/" className="flex items-center space-x-2">
                <img src="/large-logo.png" className="w-12 h-12 rounded-full" />
                <span className="pl-3 font-bold font-oldenburg text-lg text-blue-900">Mock Trial Online Trainer</span>
                </a>

                <div className="flex items-center space-x-3">
                {user && <p className="text-blue-900 font-semibold">{user.email}</p>}
                <button
                    onClick={async () => { await signOut(auth); router.push('/') }}
                    className="px-4 py-2 bg-red-500 rounded-full text-white font-semibold hover:bg-red-400 transition"
                >
                    Logout
                </button>
                </div>
            </header>


            {/* main area */}
            <div className="flex flex-col items-center text-center pt-24">

                <h1 className='text-blue-950 text-5xl font-bold font-oldenburg m-9'>Welcome to the MTOT!</h1>

                <div className='flex flex-row justify-center'>
                    <div className='flex flex-col items-center bg-zinc-200 rounded-3xl w-100 p-5 m-9'>
                        <Link 
                            href="/protected/main" 
                            className='text-3xl rounded-full px-4 py-1 mb-4 bg-blue-500 hover:bg-blue-400 transition'
                        >Your Cases</Link>
                        <p>
                            Hone your skills for future mock trials!
                            Practice in real time with instant mini-cases. 
                            You can practice any role and you will immediately get feedback in custom mini-cases.
                            Review past cases to see how you have improved over time.

                        </p>
                    </div>
                    <div className='flex flex-col items-center bg-zinc-200 rounded-3xl w-100 p-5 m-9'>
                        <Link 
                            href="/protected/learning" 
                            className='text-3xl rounded-full px-4 py-1 mb-4 bg-yellow-400 hover:bg-yellow-300 transition'
                        >Learning Mode</Link>
                        <p>
                            Learn about the rules of mock trial, and how to use this tool. 
                            This covers everything from trial etiquette, to objections, to general advice on how to win trials. 
                            It also provide information on the best ways to use the MTOT.
                        </p>
                    </div>
                </div>
                <div className=''>
                    <p>stats</p>
                </div>
            </div>
        </div>
    )
}