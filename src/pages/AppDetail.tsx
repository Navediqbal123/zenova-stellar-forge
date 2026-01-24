import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Download, Share2, Flag, ExternalLink, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApps } from '@/contexts/AppsContext';

export default function AppDetail() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { getAppById, categories } = useApps();

  const app = appId ? getAppById(appId) : undefined;

  if (!app) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md text-center"
        >
          <p className="text-xl text-muted-foreground mb-4">App not found</p>
          <Button onClick={() => navigate('/apps')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Apps
          </Button>
        </motion.div>
      </div>
    );
  }

  const category = categories.find(c => c.id === app.category_id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <Link to="/apps" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Apps
      </Link>

      <div className="glass-card p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-6xl shrink-0 animate-float">
            {app.icon || '📱'}
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">{app.name}</h1>
              <p className="text-primary">{app.developer_name}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-warning fill-current" />
                <span className="font-semibold">{app.rating}</span>
                <span className="text-muted-foreground">({app.review_count.toLocaleString()} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Download className="w-5 h-5" />
                <span>
                  {app.downloads >= 1000000 
                    ? `${(app.downloads / 1000000).toFixed(1)}M+`
                    : `${(app.downloads / 1000).toFixed(0)}K+`
                  } downloads
                </span>
              </div>
              <Link to={`/categories/${app.category_id}`}>
                <span className="px-3 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                  {category?.icon} {category?.name}
                </span>
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="bg-primary hover:bg-primary/90 px-8">
                <Download className="w-5 h-5 mr-2" />
                Install
              </Button>
              <Button variant="outline"><Share2 className="w-5 h-5" /></Button>
              <Button variant="outline"><Flag className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold gradient-text">{app.size}</p>
          <p className="text-sm text-muted-foreground">Size</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold gradient-text">{app.version}</p>
          <p className="text-sm text-muted-foreground">Version</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold gradient-text">4+</p>
          <p className="text-sm text-muted-foreground">Age Rating</p>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-semibold">About this app</h2>
        <p className="text-muted-foreground leading-relaxed">
          {app.description || app.short_description}
        </p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-success" />
          Data Safety
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="font-medium mb-1">Data encryption</p>
            <p className="text-sm text-muted-foreground">Data is encrypted in transit</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="font-medium mb-1">Data deletion</p>
            <p className="text-sm text-muted-foreground">You can request that data be deleted</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Developer contact</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="font-medium">{app.developer_name}</p>
            <p className="text-sm text-muted-foreground">Developer</p>
          </div>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Website
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
