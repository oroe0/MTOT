import Image from "next/image";
import Link from "next/link";

export default function Home(){
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-6xl font-bold text-gray mb-8">
        Mock Trial Online Trainer
      </h1>
      <nav className="space-x-4 flex flex-row">
        <Link href="/register" className="block px-4 py-3 bg-blue-500 rounded text-white rounded-Ig hover:bg-blue-400 transition"> 
          <strong>Create an Account</strong>
        </Link>
        <Link href="/login" className="block px-4 py-3 bg-cyan-500 rounded text-white rounded-Ig hover:bg-cyan-400 transition">
          <strong>Login</strong> 
        </Link>
        <Link href="/protected" className="block px-4 py-3 bg-teal-500 rounded text-white rounded-Ig hover:bg-teal-400 transition">
          <strong>Access Trainer</strong>
        </Link>
      </nav> 
      
      {/** main content of home page */}
      <div className="flex-1 p-6 flex flex-col items-center">
        <div className="max-w-xl w-full bg-white rounded shadow p-6 mb-4">
          <h1 className="text-4xl font-bold pb-5">
            Purpose of the <abbr title="Mock Trial Online Trainer" className="hover:text-blue-900 transition">MTOT</abbr>
          </h1>
          <p>
            This website was built to help people train their mock trial skills, because other than real trials, there is very little way to practice.
            The MTOT allows you to practice any role on any side in a trial, or practice every role in one large trial. 
            It uses AI to generate everything neccesary for the trial.
          </p>
        </div>
      </div>
    </div>
  );
}