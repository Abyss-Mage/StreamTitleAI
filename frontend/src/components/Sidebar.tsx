'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { 
  Grid, Search, Clock, Settings, Zap, Coffee, 
  MessageSquare, LogOut, Sun, Moon, CreditCard, Activity,
  ChevronLeft, ChevronRight, X
} from 'react-feather';
import { useState, useEffect } from 'react';
import FeedbackModal from './FeedbackModal'; // Ensure you have created this component

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState('dark');
  
  // State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Load Theme
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

  // Helper for link styling (active state + collapsed logic)
  const getLinkClass = (path: string) => {
    const isActive = pathname?.startsWith(path);
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium whitespace-nowrap ${
      isActive 
        ? 'bg-surface text-primary shadow-[0_0_10px_var(--primary-glow)]' 
        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
    } ${isCollapsed ? 'justify-center px-2' : ''}`;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-[var(--bg-color)] transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:relative
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        w-64 flex-shrink-0
      `}>
        
        {/* Header / Logo */}
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 truncate">
              StreamTitle
            </h1>
          )}
          {/* Mobile Close Button */}
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-2 flex-1 px-3 overflow-y-auto scrollbar-hide">
          
          {/* Dashboard Section */}
          {!isCollapsed && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 mt-2 px-3 animate-in fade-in">Dashboard</div>}
          
          <Link href="/home" className={getLinkClass('/home')} title="Home">
            <Grid size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>Home</span>}
          </Link>
          <Link href="/performance" className={getLinkClass('/performance')} title="Performance">
            <Activity size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>Performance</span>}
          </Link>

          {/* Tools Section */}
          {!isCollapsed && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-1 px-3 animate-in fade-in">Tools</div>}
          <div className={isCollapsed ? 'mt-4 border-t border-border pt-4' : ''}>
            <Link href="/generator" className={getLinkClass('/generator')} title="Generator">
              <Search size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>Generator</span>}
            </Link>
            <Link href="/optimize" className={getLinkClass('/optimize')} title="Optimize">
              <Zap size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>Optimize</span>}
            </Link>
            <Link href="/discover" className={getLinkClass('/discover')} title="Discover">
              <Coffee size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>Discover</span>}
            </Link>
            <Link href="/coach" className={getLinkClass('/coach')} title="AI Coach">
              <MessageSquare size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>AI Coach</span>}
            </Link>
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto flex flex-col gap-2 p-3 border-t border-border">
          <nav className="flex flex-col gap-2 mb-4">
            <Link href="/pricing" className={getLinkClass('/pricing')} title="Pricing">
              <CreditCard size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>Pricing</span>}
            </Link>
            <Link href="/history" className={getLinkClass('/history')} title="History">
              <Clock size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>History</span>}
            </Link>
            <Link href="/settings" className={getLinkClass('/settings')} title="Settings">
              <Settings size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>Settings</span>}
            </Link>
            
            {/* Feedback Trigger */}
            <button 
              onClick={() => setIsFeedbackOpen(true)}
              className={getLinkClass('feedback')}
              title="Feedback"
            >
              <MessageSquare size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>Feedback</span>}
            </button>
          </nav>

          {/* Theme & Logout Controls */}
          <div className={`flex gap-2 ${isCollapsed ? 'flex-col' : 'flex-row'}`}>
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

          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-full h-8 items-center justify-center text-slate-500 hover:text-primary hover:bg-white/5 rounded-lg mt-2 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
}