import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppsProvider } from "./contexts/AppsContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Apps from "./pages/Apps";
import AppDetail from "./pages/AppDetail";
import Categories from "./pages/Categories";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DeveloperRegister from "./pages/developer/DeveloperRegister";
import DeveloperDashboard from "./pages/developer/DeveloperDashboard";
import AppUploadWizard from "./pages/developer/AppUploadWizard";
import AIUploadPage from "./pages/developer/AIUploadPage";
import AdminPanel from "./pages/admin/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();


const App = () => (
  <ErrorBoundary fallbackTitle="App Error" fallbackMessage="Something went wrong. Please refresh the page.">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <Routes>
                  {/* Developer routes with their own layout */}
                  <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
                  <Route path="/developer/upload" element={<AppUploadWizard />} />
                  <Route path="/developer/ai-upload" element={<AIUploadPage />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  
                  {/* All other routes use MainLayout */}
                  <Route path="*" element={
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/apps/:appId" element={<AppDetail />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/categories/:categoryId" element={<Categories />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/developer/register" element={<DeveloperRegister />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </MainLayout>
                  } />
                </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
