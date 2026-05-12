import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  Package, 
  BookOpen, 
  Calculator, 
  Users, 
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { hasRole, ROUTE_PERMISSIONS, ROLE_LABELS } from '@/lib/roles';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: UtensilsCrossed, label: 'Menu Items', path: '/menu' },
  { icon: ShoppingCart, label: 'Orders', path: '/orders' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: BookOpen, label: 'Recipes', path: '/recipes' },
  { icon: Calculator, label: 'Catering Quotes', path: '/catering' },
  { icon: Users, label: 'Customers', path: '/customers' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const userRole = user?.role || 'staff';
  const visibleNavItems = navItems.filter(item => {
    const required = ROUTE_PERMISSIONS[item.path];
    return required ? hasRole(userRole, required) : true;
  });

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-sidebar text-sidebar-foreground z-50 transition-all duration-300 flex flex-col",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sidebar-primary-foreground font-heading font-bold text-lg">C</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-heading font-bold text-base text-sidebar-foreground leading-tight">Candora</h1>
              <p className="text-xs text-sidebar-foreground/60">Food Services</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "drop-shadow-sm")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {!collapsed && user && (
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user.full_name || user.email}</p>
              <p className="text-[10px] text-sidebar-foreground/50 capitalize">{ROLE_LABELS[userRole] || userRole}</p>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center p-3 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>
    </>
  );
}