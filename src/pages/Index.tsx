import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Mic, Star, Gamepad2, AppWindow, Flame, X, LogOut, Home, Code, LayoutDashboard, Shield, LogIn, UserPlus, Menu } from 'lucide-react';
import { useApps } from '@/contexts/AppsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

const ACCENT = '#0EA5E9';

const featuredSlides = [
  { title: 'Edit Like a Pro', subtitle: 'Powerful tools for creators on the go' },
  { title: 'Play Without Limits', subtitle: 'Top games handpicked for your device' },
  { title: 'Boost Your Day', subtitle: 'Productivity apps that actually work' },
];

function FeaturedCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(c => (c + 1) % featuredSlides.length), 4500);
    return () => clearInterval(t);
  }, []);
  const s = featuredSlides[i];
  return (
    <div
      className="relative overflow-hidden rounded-3xl h-48 px-6 py-5 flex flex-col justify-between shadow-lg"
      style={{
        background: `linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0066CC 100%)`,
      }}
    >
      {/* Wave overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 200" preserveAspectRatio="none">
        <path d="M0,140 Q100,100 200,130 T400,120 L400,200 L0,200 Z" fill="white" fillOpacity="0.4" />
        <path d="M0,160 Q120,120 240,150 T400,140 L400,200 L0,200 Z" fill="white" fillOpacity="0.25" />
      </svg>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.4 }}
          className="relative z-10"
        >
          <p className="text-xs font-semibold tracking-wider mb-2 text-white/90">FEATURED</p>
          <h2 className="text-2xl font-bold text-white mb-1">{s.title}</h2>
          <p className="text-sm text-white/85">{s.subtitle}</p>
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex items-center justify-between">
        <button
          className="px-4 py-2 rounded-full text-sm font-semibold border-2 border-white/80 bg-white/15 backdrop-blur-sm text-white transition-all hover:bg-white/25"
        >
          See Details
        </button>
        <div className="flex gap-1.5">
          {featuredSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: idx === i ? 20 : 6,
                backgroundColor: idx === i ? '#ffffff' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const { apps } = useApps();
  const { isAuthenticated, isAdmin, developerProfile } = useAuth();
  const [tab, setTab] = useState<'games' | 'apps' | 'trending' | 'search'>('apps');
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const approved = apps.filter(a => a.status === 'approved');
  const games = approved.filter(a => (a.category || '').toLowerCase() === 'games');
  const nonGames = approved.filter(a => (a.category || '').toLowerCase() !== 'games');
  const trending = [...approved].sort((a, b) => b.downloads - a.downloads);
  const recommended = approved.slice(0, 8);

  const list = query
    ? approved.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
    : tab === 'games' ? games
    : tab === 'apps' ? nonGames
    : tab === 'trending' ? trending
    : approved;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden text-slate-900" style={{ backgroundColor: '#F2F2F7', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
      <div className="w-full max-w-2xl mx-auto px-5 pt-6 pb-28">

        {/* Top Bar */}
        <header className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawerOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-slate-200/60 transition-colors" aria-label="Open menu">
              <Menu className="w-7 h-7 text-slate-900" strokeWidth={2.5} />
            </button>
            <button onClick={() => setDrawerOpen(true)} className="text-left">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Elora <span style={{ color: ACCENT }}>X</span></h1>
            </button>
          </div>
          <button className="relative p-2.5 rounded-full hover:bg-slate-200/60 transition-colors">
            <Bell className="w-6 h-6 text-slate-700" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
          </button>
        </header>

        {/* Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-200 mb-6">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps, games, and more"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 text-slate-900"
          />
          <button className="shrink-0">
            <Mic className="w-5 h-5" style={{ color: ACCENT }} />
          </button>
        </div>

        {/* Featured */}
        <section className="mb-8">
          <FeaturedCarousel />
        </section>

        {/* Recommended */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900">
              {query ? 'Search Results' : tab === 'games' ? 'Top Games' : tab === 'trending' ? 'Trending Now' : 'Recommended for You'}
            </h3>
            <button className="text-sm font-semibold" style={{ color: ACCENT }}>See All ›</button>
          </div>

          <div className="space-y-1">
            {(query ? list : recommended).length > 0 ? (
              (query ? list : recommended).map((app, idx) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Link to={`/apps/${app.id}`} className="flex items-center gap-3 py-3 group">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                      {app.icon_url && app.icon_url.startsWith('http') ? (
                        <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" />
                      ) : (app.icon || '📱')}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 truncate">{app.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{app.category || 'App'}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs text-slate-600 font-medium">{app.rating || '4.5'}</span>
                      </div>
                    </div>
                    {/* Get button */}
                    <button
                      onClick={(e) => { e.preventDefault(); window.location.href = `/apps/${app.id}`; }}
                      className="px-5 py-1.5 rounded-full text-sm font-bold transition-all hover:scale-105"
                      style={{ backgroundColor: '#F1F5F9', color: ACCENT }}
                    >
                      Get
                    </button>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">No apps found</div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-2 safe-bottom">
          {[
            { id: 'games', label: 'Games', Icon: Gamepad2 },
            { id: 'apps', label: 'Apps', Icon: AppWindow },
            { id: 'trending', label: 'Trending', Icon: Flame },
            { id: 'search', label: 'Search', Icon: Search },
          ].map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => { setTab(id as any); setQuery(''); }}
                className="flex flex-col items-center gap-1 px-4 py-1.5 transition-all"
              >
                <Icon className="w-6 h-6" style={{ color: active ? ACCENT : '#94A3B8' }} />
                <span className="text-[11px] font-medium" style={{ color: active ? ACCENT : '#94A3B8' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Drawer (accessed by tapping logo) */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 z-[70] flex flex-col"
              style={{ backgroundColor: '#1C1C1E', boxShadow: '8px 0 32px rgba(0,0,0,0.45)' }}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">Elora <span style={{ color: ACCENT }}>X</span></h2>
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <nav className="flex-1 min-h-0 p-4 space-y-1 overflow-y-auto">
                {[
                  { name: 'Home', path: '/', icon: Home, show: true, active: true },
                  { name: 'Become a Developer', path: isAuthenticated ? '/developer/register' : '/register', icon: Code, show: !developerProfile },
                  { name: 'Developer Dashboard', path: '/developer/dashboard', icon: LayoutDashboard, show: !!developerProfile },
                  { name: 'Admin Panel', path: '/admin', icon: Shield, show: isAdmin },
                ].filter(i => i.show).map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-colors"
                    style={item.active ? { backgroundColor: '#2C2C2E' } : undefined}>
                    <item.icon className="w-5 h-5" style={{ color: ACCENT }} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t border-white/10 space-y-2">
                {isAuthenticated ? (
                  <Button onClick={handleLogout} className="w-full justify-start gap-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30">
                    <LogOut className="w-4 h-4" /> Logout
                  </Button>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setDrawerOpen(false)}>
                      <Button variant="outline" className="w-full justify-start gap-2"><LogIn className="w-4 h-4" /> Sign In</Button>
                    </Link>
                    <Link to="/register" onClick={() => setDrawerOpen(false)}>
                      <Button className="w-full justify-start gap-2 text-white" style={{ backgroundColor: ACCENT }}>
                        <UserPlus className="w-4 h-4" /> Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
