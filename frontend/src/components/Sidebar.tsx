'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { 
  Grid, Search, Clock, Settings, Zap, Coffee, 
  MessageSquare, LogOut, Sun, Moon 
} from 'react-feather';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState('dark');

  // Toggle Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('apiToken');
    router.push('/login');
  };

  // Helper for active link styling
  const getLinkClass = (path: string) => {
    const isActive = pathname?.startsWith(path);
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium ${
      isActive 
        ? 'bg-surface text-primary shadow-[0_0_10px_var(--primary-glow)]' 
        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
    }`;
  };

  return (
    <aside className="w-64 h-screen flex-shrink-0 flex flex-col border-r border-border bg-[var(--bg-color)] p-6 transition-all">
      <h1 className="text-2xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
        StreamTitle.AI
      </h1>

      <nav className="flex flex-col gap-2 flex-1">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-3">Dashboard</div>
        <Link href="/home" className={getLinkClass('/home')}>
          <Grid size={18} />
          <span>Home</span>
        </Link>

        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-1 px-3">Content Tools</div>
        <Link href="/generator" className={getLinkClass('/generator')}>
          <Search size={18} />
          <span>Generator (V2)</span>
        </Link>
        <Link href="/optimize" className={getLinkClass('/optimize')}>
          <Zap size={18} />
          <span>Optimize</span>
        </Link>
        <Link href="/discover" className={getLinkClass('/discover')}>
          <Coffee size={18} />
          <span>Discover</span>
        </Link>
        <Link href="/coach" className={getLinkClass('/coach')}>
          <MessageSquare size={18} />
          <span>AI Coach</span>
        </Link>
      </nav>

      <div className="mt-auto flex flex-col gap-4 pt-6 border-t border-border">
        <nav className="flex flex-col gap-2">
          <Link href="/history" className={getLinkClass('/history')}>
            <Clock size={18} />
            <span>History</span>
          </Link>
          <Link href="/settings" className={getLinkClass('/settings')}>
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="flex gap-2">
          <button 
            onClick={toggleTheme} 
            className="flex-1 h-10 flex items-center justify-center rounded-lg border border-border bg-surface text-slate-400 hover:text-primary hover:border-primary transition-colors"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button 
            onClick={handleSignOut}
            className="flex-1 h-10 flex items-center justify-center rounded-lg border border-border bg-surface text-slate-400 hover:text-red-400 hover:border-red-400 transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}