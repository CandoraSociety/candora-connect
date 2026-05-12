import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Clock, CheckCircle2, ChefHat, XCircle, Package, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  preparing: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: ChefHat },
  ready: { color: 'bg-accent/10 text-accent border-accent/20', icon: Package },
  completed: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

const ORDER_TYPES = ['dine_in', 'takeout', 'catering', 'delivery', 'kiosk'];

export default function Orders() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const [newOrder, setNewOrder] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    order_type: 'dine_in', items: [], notes: '', payment_method: 'card',
  });
  const [cartItems, setCartItems] = useState([]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Auto-create/update customer
      if (newOrder.customer_name) {
        base44.entities.Customer.filter({ name: newOrder.customer_name }).then(existing => {
          if (existing.length > 0) {
            base44.entities.Customer.update(existing[0].id, {
              total_orders: (existing[0].total_orders || 0) + 1,
              last_order_date: new Date().toISOString().split('T')[0],
            });
          } else {
            base44.entities.Customer.create({
              name: newOrder.customer_name,
              email: newOrder.customer_email,
              phone: newOrder.customer_phone,
              total_orders: 1,
              last_order_date: new Date().toISOString().split('T')[0],
              preferred_order_type: newOrder.order_type,
            });
          }
        });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      }
      setDialogOpen(false);
      setCartItems([]);
      setNewOrder({ customer_name: '', customer_email: '', customer_phone: '', order_type: 'dine_in', items: [], notes: '', payment_method: 'card' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const addToCart = (menuItem) => {
    const existing = cartItems.find(c => c.menu_item_id === menuItem.id);
    if (existing) {
      setCartItems(cartItems.map(c => c.menu_item_id === menuItem.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCartItems([...cartItems, { menu_item_id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 }]);
    }
  };

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.08;

  const handleCreateOrder = () => {
    createMutation.mutate({
      ...newOrder,
      items: cartItems,
      subtotal,
      tax,
      total: subtotal + tax,
    });
  };

  const filtered = orders.filter(o =>
    (filterStatus === 'all' || o.status === filterStatus) &&
    (o.customer_name?.toLowerCase().includes(search.toLowerCase()) || o.id?.includes(search))
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Track and manage all orders">
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />New Order</Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by customer or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.keys(STATUS_CONFIG).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map(order => {
          const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
          const Icon = config.icon;
          return (
            <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color} border`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_date), 'MMM d, yyyy h:mm a')} · <span className="capitalize">{order.order_type?.replace('_', ' ')}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold font-heading">${order.total?.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{order.items?.length || 0} items</p>
                  </div>
                  <Select value={order.status} onValueChange={s => updateStatusMutation.mutate({ id: order.id, status: s })}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(STATUS_CONFIG).map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {order.items?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {order.items.map((item, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{item.quantity}x {item.name}</Badge>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No orders found</p>
          </div>
        )}
      </div>

      {/* New Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">New Order</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div><Label>Customer Name</Label><Input value={newOrder.customer_name} onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} /></div>
              <div><Label>Email</Label><Input value={newOrder.customer_email} onChange={e => setNewOrder({...newOrder, customer_email: e.target.value})} /></div>
              <div><Label>Phone</Label><Input value={newOrder.customer_phone} onChange={e => setNewOrder({...newOrder, customer_phone: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Order Type</Label>
                  <Select value={newOrder.order_type} onValueChange={v => setNewOrder({...newOrder, order_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ORDER_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Payment</Label>
                  <Select value={newOrder.payment_method} onValueChange={v => setNewOrder({...newOrder, payment_method: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Notes</Label><Textarea value={newOrder.notes} onChange={e => setNewOrder({...newOrder, notes: e.target.value})} /></div>
            </div>
            <div>
              <Label className="mb-2 block">Menu Items</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2">
                {menuItems.filter(m => m.is_available !== false).map(m => (
                  <button key={m.id} onClick={() => addToCart(m)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-muted text-sm transition-colors">
                    <span>{m.name}</span><span className="font-medium">${m.price?.toFixed(2)}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Label>Cart</Label>
                {cartItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted rounded-lg p-2">
                    <span className="text-sm">{item.quantity}x {item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setCartItems(cartItems.filter((_, idx) => idx !== i))}>×</Button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>${(subtotal + tax).toFixed(2)}</span></div>
                </div>
              </div>
              <Button onClick={handleCreateOrder} className="w-full mt-4" disabled={!newOrder.customer_name || cartItems.length === 0}>
                Place Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}