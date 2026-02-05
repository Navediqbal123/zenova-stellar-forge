import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppsProvider } from "./contexts/AppsContext";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Apps from "./pages/Apps";
import AppDetail from "./pages/AppDetail";
import Categories from "./pages/Categories";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DeveloperRegister from "./pages/developer/DeveloperRegister";
import DeveloperDashboard from "./pages/developer/DeveloperDashboard";
import AdminPanel from "./pages/admin/AdminPanel";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Component to handle auto-redirect based on auth state
function AuthRedirectHandler({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isDeveloperApproved, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Only redirect after initial auth check is complete
    if (!isLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true);
      
      // Only auto-redirect if user is on login/register page and is authenticated
      const authPages = ['/login', '/register'];
      
      if (isAuthenticated && authPages.includes(location.pathname)) {
        if (isAdmin) {
          navigate('/admin', { replace: true });
        } else if (isDeveloperApproved) {
          navigate('/developer/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    }
  }, [isAuthenticated, isAdmin, isDeveloperApproved, isLoading, hasCheckedAuth, location.pathname, navigate]);

  // Show loading spinner during initial auth check
  if (isLoading && !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthRedirectHandler>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/apps" element={<Apps />} />
                  <Route path="/apps/:appId" element={<AppDetail />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/categories/:categoryId" element={<Categories />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/developer/register" element={<DeveloperRegister />} />
                  <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MainLayout>
            </AuthRedirectHandler>
          </BrowserRouter>
        </TooltipProvider>
      </AppsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
