import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, Package, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import StatCard from '../components/shared/StatCard';
import PageHeader from '../components/shared/PageHeader';

const COLORS = ['hsl(25, 85%, 55%)', 'hsl(160, 45%, 40%)', 'hsl(35, 90%, 58%)', 'hsl(200, 50%, 50%)', 'hsl(340, 65%, 55%)'];

export default function Dashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.InventoryItem.list(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed');
    const lowStockItems = inventory.filter(i => i.quantity <= (i.reorder_level || 0));

    // Sales by item
    const itemSales = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        if (!itemSales[item.name]) itemSales[item.name] = { name: item.name, revenue: 0, quantity: 0 };
        itemSales[item.name].revenue += (item.price || 0) * (item.quantity || 0);
        itemSales[item.name].quantity += (item.quantity || 0);
      });
    });
    const topItems = Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    // Sales by category
    const categorySales = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const menuItem = menuItems.find(m => m.id === item.menu_item_id);
        const cat = menuItem?.category || 'other';
        if (!categorySales[cat]) categorySales[cat] = 0;
        categorySales[cat] += (item.price || 0) * (item.quantity || 0);
      });
    });
    const categoryData = Object.entries(categorySales).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

    // Daily sales (last 14 days)
    const dailySales = {};
    for (let i = 13; i >= 0; i--) {
      const day = format(subDays(new Date(), i), 'MMM dd');
      dailySales[day] = 0;
    }
    orders.forEach(order => {
      const day = format(new Date(order.created_date), 'MMM dd');
      if (dailySales[day] !== undefined) {
        dailySales[day] += (order.total || 0);
      }
    });
    const dailyData = Object.entries(dailySales).map(([date, total]) => ({ date, total }));

    return { totalRevenue, completedOrders: completedOrders.length, lowStockItems, topItems, categoryData, dailyData };
  }, [orders, menuItems, inventory]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Welcome back to Candora Food Services" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} trend={12} />
        <StatCard title="Total Orders" value={orders.length} icon={ShoppingCart} subtitle={`${stats.completedOrders} completed`} />
        <StatCard title="Customers" value={customers.length} icon={Users} />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockItems.length}
          icon={AlertTriangle}
          className={stats.lowStockItems.length > 0 ? "border-destructive/30" : ""}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Sales Trend (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
                <Line type="monotone" dataKey="total" stroke="hsl(25, 85%, 55%)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                    {stats.categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No sales data yet</div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {stats.categoryData.map((item, i) => (
                <Badge key={item.name} variant="outline" className="text-xs capitalize">
                  <span className="w-2 h-2 rounded-full mr-1.5 inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                  {item.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Items & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topItems} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                  <Bar dataKey="revenue" fill="hsl(25, 85%, 55%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No sales data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {stats.lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/15">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.category?.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-destructive">{item.quantity} {item.unit}</p>
                      <p className="text-xs text-muted-foreground">Reorder at {item.reorder_level}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <Package className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">All stock levels are healthy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}