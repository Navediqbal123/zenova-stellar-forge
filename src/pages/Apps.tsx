import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, Download, Filter, Grid, List, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApps } from '@/contexts/AppsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Apps() {
  const { apps, categories, searchApps } = useApps();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const approvedApps = apps.filter(app => app.status === 'approved');

  const filteredApps = useMemo(() => {
    let result = approvedApps;
    if (searchQuery) result = searchApps(searchQuery);
    if (selectedCategory !== 'all') result = result.filter(app => app.category === selectedCategory);

    switch (sortBy) {
      case 'popular': result = [...result].sort((a, b) => b.downloads - a.downloads); break;
      case 'rating': result = [...result].sort((a, b) => b.rating - a.rating); break;
      case 'newest': result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'name': result = [...result].sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return result;
  }, [approvedApps, searchQuery, selectedCategory, sortBy, searchApps]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl lg:text-4xl font-bold">All <span className="gradient-text">Apps</span></h1>
        <p className="text-muted-foreground">Discover and download the best applications</p>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type="text" placeholder="Search apps..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-muted/50 border-muted" />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full lg:w-48 bg-muted/50 border-muted"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-48 bg-muted/50 border-muted"><SlidersHorizontal className="w-4 h-4 mr-2" /><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
            <Button variant="ghost" size="sm" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-primary/20 text-primary' : ''}><Grid className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-primary/20 text-primary' : ''}><List className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Showing <span className="text-foreground font-medium">{filteredApps.length}</span> apps</p>

      {filteredApps.length === 0 ? (
        <div className="glass-card p-12 text-center"><p className="text-xl text-muted-foreground mb-4">No apps found</p></div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => (
            <Link key={app.id} to={`/apps/${app.id}`}>
              <div className="glass-card p-5 hover-glow transition-all duration-300 group h-full">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shrink-0">{app.icon || '📱'}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">{app.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{app.developer_name}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{app.short_description}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-warning"><Star className="w-4 h-4 fill-current" />{app.rating}</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Download className="w-4 h-4" />{app.downloads >= 1000000 ? `${(app.downloads / 1000000).toFixed(1)}M` : `${(app.downloads / 1000).toFixed(0)}K`}</span>
                  </div>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">Get</Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <Link key={app.id} to={`/apps/${app.id}`}>
              <div className="glass-card p-4 hover-glow transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 shrink-0">{app.icon || '📱'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{app.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{app.category}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{app.developer_name}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-warning"><Star className="w-4 h-4 fill-current" />{app.rating}</span>
                    <span className="text-muted-foreground">{app.size}</span>
                  </div>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 shrink-0">Get</Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}
