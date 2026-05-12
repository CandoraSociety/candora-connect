import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, Calendar, ShoppingCart, DollarSign, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getCustomerOrders = (customerName) => {
    return orders.filter(o => o.customer_name?.toLowerCase() === customerName?.toLowerCase());
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" subtitle={`${customers.length} total customers`} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead>Preferred</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(customer => (
              <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCustomer(customer)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{customer.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.tags?.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {customer.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {customer.email && <p className="text-muted-foreground">{customer.email}</p>}
                    {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono">{customer.total_orders || 0}</TableCell>
                <TableCell className="text-right font-medium">${(customer.total_spent || 0).toFixed(2)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {customer.last_order_date ? format(new Date(customer.last_order_date), 'MMM d, yyyy') : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize text-xs">{customer.preferred_order_type?.replace('_', ' ') || '—'}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No customers found</p>
          </div>
        )}
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-base font-bold text-primary">{selectedCustomer.name?.[0]?.toUpperCase()}</span>
                  </div>
                  {selectedCustomer.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" />{selectedCustomer.email}</div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" />{selectedCustomer.phone}</div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3 text-center">
                    <ShoppingCart className="w-5 h-5 mx-auto text-primary mb-1" />
                    <p className="text-lg font-bold">{selectedCustomer.total_orders || 0}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <DollarSign className="w-5 h-5 mx-auto text-primary mb-1" />
                    <p className="text-lg font-bold">${(selectedCustomer.total_spent || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <Calendar className="w-5 h-5 mx-auto text-primary mb-1" />
                    <p className="text-sm font-bold">{selectedCustomer.last_order_date ? format(new Date(selectedCustomer.last_order_date), 'MMM d') : '—'}</p>
                    <p className="text-xs text-muted-foreground">Last Order</p>
                  </Card>
                </div>

                {/* Order History */}
                <div>
                  <h3 className="font-heading font-semibold mb-2">Order History</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getCustomerOrders(selectedCustomer.name).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm font-medium capitalize">{order.order_type?.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(order.created_date), 'MMM d, yyyy h:mm a')}</p>
                          {order.event_date && <p className="text-xs text-muted-foreground">Event: {format(new Date(order.event_date), 'MMM d, yyyy')}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">${order.total?.toFixed(2)}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {getCustomerOrders(selectedCustomer.name).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No orders found</p>
                    )}
                  </div>
                </div>

                {selectedCustomer.notes && (
                  <div>
                    <h3 className="font-heading font-semibold mb-1">Notes</h3>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}