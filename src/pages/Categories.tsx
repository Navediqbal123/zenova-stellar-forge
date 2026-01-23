import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Download, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApps } from '@/contexts/AppsContext';

export default function Categories() {
  const { categoryId } = useParams();
  const { categories, getAppsByCategory } = useApps();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // If categoryId is provided, show apps in that category
  if (categoryId) {
    const category = categories.find(c => c.id === categoryId);
    const apps = getAppsByCategory(categoryId);

    if (!category) {
      return (
        <div className="glass-card p-12 text-center">
          <p className="text-xl text-muted-foreground mb-4">Category not found</p>
          <Link to="/categories">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categories
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Link to="/categories" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Categories
          </Link>

          <div className="glass-card p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl">
                {category.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{category.name}</h1>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Apps in Category */}
        {apps.length === 0 ? (
          <motion.div variants={itemVariants} className="glass-card p-12 text-center">
            <p className="text-xl text-muted-foreground mb-2">No apps in this category yet</p>
            <p className="text-sm text-muted-foreground">Check back soon!</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {apps.map((app, index) => (
              <motion.div
                key={app.id}
                variants={itemVariants}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/apps/${app.id}`}>
                  <div className="glass-card p-5 hover-glow transition-all duration-300 group h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shrink-0">
                        {app.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {app.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {app.developerName}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                      {app.shortDescription}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-warning">
                          <Star className="w-4 h-4 fill-current" />
                          {app.rating}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Download className="w-4 h-4" />
                          {app.downloads >= 1000000 
                            ? `${(app.downloads / 1000000).toFixed(1)}M`
                            : `${(app.downloads / 1000).toFixed(0)}K`
                          }
                        </span>
                      </div>
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        Get
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Show all categories
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">
          Browse <span className="gradient-text">Categories</span>
        </h1>
        <p className="text-muted-foreground">
          Explore apps organized by category
        </p>
      </motion.div>

      {/* Categories Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {categories.map((category, index) => {
          const apps = getAppsByCategory(category.id);
          
          return (
            <motion.div
              key={category.id}
              variants={itemVariants}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/categories/${category.id}`}>
                <div className="glass-card p-6 hover-glow transition-all duration-300 group cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {category.description}
                  </p>
                  
                  <div className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">{apps.length}</span> apps
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
