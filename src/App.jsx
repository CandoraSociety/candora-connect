import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import MenuItems from './pages/MenuItems';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import RecipeEditor from './pages/RecipeEditor';
import CateringQuotes from './pages/CateringQuotes';
import CateringQuoteBuilder from './pages/CateringQuoteBuilder';
import Customers from './pages/Customers';
import CateringRequest from './pages/CateringRequest';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-xl">C</span>
          </div>
          <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/menu" element={<MenuItems />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/recipes/new" element={<RecipeEditor />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/catering" element={<CateringQuotes />} />
        <Route path="/catering/new" element={<CateringQuoteBuilder />} />
        <Route path="/customers" element={<Customers />} />
      </Route>
      <Route path="/catering-request" element={<CateringRequest />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App