import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="glass-card p-12">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <span className="text-5xl">🔍</span>
          </div>
          
          <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
          <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
            <Link to="/apps">
              <Button variant="outline" className="w-full sm:w-auto">
                <Search className="w-4 h-4 mr-2" />
                Browse Apps
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
