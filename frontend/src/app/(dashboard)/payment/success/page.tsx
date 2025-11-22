'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'react-feather';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
        <CheckCircle size={40} />
      </div>
      <h1 className="text-3xl font-bold text-slate-100 mb-2">Upgrade Successful!</h1>
      <p className="text-slate-400 max-w-md mb-8">
        Thank you for supporting StreamTitle.AI. Your Pro features have been unlocked.
      </p>
      
      <Link href="/home" className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-violet-500 transition-colors flex items-center gap-2">
        Go to Dashboard <ArrowRight size={20} />
      </Link>
    </div>
  );
}