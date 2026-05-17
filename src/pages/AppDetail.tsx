import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Star, Shield, Tag, User, HardDrive, ChevronDown, Gamepad2, AppWindow, Flame, Search } from 'lucide-react';
import { useApps } from '@/contexts/AppsContext';
import { Button } from '@/components/ui/button';
import InstallButton from '@/components/appdetail/InstallButton';
import RatingReview from '@/components/appdetail/RatingReview';

const ACCENT = '#0EA5E9';

export default function AppDetail() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getAppById } = useApps();

  const app = appId ? getAppById(appId) : undefined;

  if (!app) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: '#F2F2F7' }}>
        <div className="text-center p-8">
          <p className="text-lg text-slate-700 mb-4">App not found</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: app.name, url });
      else await navigator.clipboard.writeText(url);
    } catch {}
  };

  const reviewCount = (app.review_count || 0).toLocaleString();
  const screenshot = (app.screenshots as string[] | undefined)?.[0];

  const navItems = [
    { id: 'games', label: 'Games', Icon: Gamepad2 },
    { id: 'apps', label: 'Apps', Icon: AppWindow },
    { id: 'trending', label: 'Trending', Icon: Flame },
    { id: 'search', label: 'Search', Icon: Search },
  ];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0.6 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
      className="min-h-screen w-full max-w-[100vw] overflow-x-hidden text-slate-900"
      style={{ backgroundColor: '#F2F2F7', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
    >
      <div className="w-full max-w-2xl mx-auto px-5 pt-5 pb-28">
        {/* Top bar */}
        <header className="flex items-center justify-between mb-5">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-slate-200/60 transition" aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
          </button>
          <button onClick={handleShare} className="p-2 -mr-2 rounded-full hover:bg-slate-200/60 transition" aria-label="Share">
            <Share2 className="w-6 h-6 text-slate-900" strokeWidth={2} />
          </button>
        </header>

        {/* App header */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 mb-5"
        >
          <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white shadow-md flex items-center justify-center text-4xl shrink-0 border border-slate-200">
            {app.icon_url && app.icon_url.startsWith('http')
              ? <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" />
              : (app.icon || '📱')}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-xl font-bold leading-tight text-slate-900 truncate">{app.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5 truncate">{app.category || 'App'}</p>
            {(app.in_app_purchases || app.contains_ads) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {app.in_app_purchases && (
                  <span className="text-[13px] font-bold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200" style={{ color: '#000000' }}>
                    In-App Purchases
                  </span>
                )}
                {app.contains_ads && (
                  <span className="text-[13px] font-bold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200" style={{ color: '#000000' }}>
                    Contains Ads
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.section>

        {/* Get button + in-app purchases */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="mb-3"
        >
          <div className="relative rounded-2xl overflow-hidden">
            <InstallButton appId={app.id} appName={app.name} />
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/90 pointer-events-none" />
          </div>
        </motion.div>

        {/* Info rows */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-1 py-4 mb-3 bg-white rounded-2xl border border-slate-200"
        >
          {[
            { label: 'AGE', value: '4+', Icon: Shield },
            { label: 'CATEGORY', value: app.category || 'App', Icon: Tag },
            { label: 'SIZE', value: app.size ? (String(app.size).toLowerCase().includes('mb') ? app.size : `${app.size} MB`) : 'N/A', Icon: HardDrive },
            { label: `${reviewCount} REVIEWS`, value: `${app.rating || '4.8'} ★`, Icon: Star },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="flex flex-col items-center text-center px-1 border-r border-slate-200 last:border-r-0">
              <p className="text-[11px] font-bold tracking-wider mb-1 truncate w-full" style={{ color: '#666666' }}>{label}</p>
              <Icon className="w-4 h-4 mb-1" style={{ color: '#666666' }} />
              <p className="text-[15px] font-semibold truncate w-full" style={{ color: '#000000' }}>{value}</p>
            </div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="grid grid-cols-1 gap-1 py-4 mb-6 bg-white rounded-2xl border border-slate-200"
        >
          <div className="flex flex-col items-center text-center px-1">
            <p className="text-[11px] font-bold tracking-wider mb-1" style={{ color: '#666666' }}>DOWNLOADS</p>
            <p className="text-[15px] font-semibold" style={{ color: '#000000' }}>
              {(app.downloads || 0).toLocaleString()}
            </p>
          </div>
        </motion.section>


        {/* Screenshot banner — only when a valid screenshot URL exists */}
        {screenshot && typeof screenshot === 'string' && /^https?:\/\//i.test(screenshot) && (
          <motion.section
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="relative overflow-hidden rounded-3xl mb-6 h-48 flex items-center"
            style={{ background: 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 60%, #60A5FA 100%)' }}
          >
            <div className="relative z-10 flex-1 px-5">
              <p className="text-xs font-bold tracking-wider text-blue-900/70 mb-2">PREVIEW</p>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight line-clamp-3 break-words">
                {(() => {
                  const t = app.short_description?.trim() || '';
                  if (!t || /^https?:\/\//i.test(t)) return 'Made for the way you live';
                  return t.slice(0, 40);
                })()}
              </h2>
            </div>
            <div className="relative z-10 w-28 h-44 mr-4 shrink-0">
              <div className="absolute inset-0 rounded-[1.5rem] bg-slate-900 p-1.5 shadow-2xl rotate-6">
                <div className="w-full h-full rounded-[1.2rem] overflow-hidden bg-white">
                  <img src={screenshot} alt="screenshot" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* About */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-base font-bold text-slate-900 mb-2">About this app</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {app.description || app.short_description || 'No description available.'}
          </p>
        </motion.section>

        {/* Ratings & Reviews */}
        <RatingReview appId={app.id} />
      </div>

      {/* Bottom nav (dark text) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-2 safe-bottom">
          {navItems.map(({ id, label, Icon }) => (
            <Link
              key={id}
              to="/"
              className="flex flex-col items-center gap-1 px-4 py-1.5 transition-all"
            >
              <Icon className="w-6 h-6 text-slate-900" />
              <span className="text-[11px] font-semibold text-slate-900">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </motion.div>
  );
}
