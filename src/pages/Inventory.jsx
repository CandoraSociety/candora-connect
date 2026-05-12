import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, AlertTriangle, Pencil, Trash2, Package } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';

const CATEGORIES = ['produce', 'dairy', 'meat', 'seafood', 'dry_goods', 'spices', 'beverages', 'frozen', 'packaging', 'other'];
const UNITS = ['lbs', 'oz', 'gal', 'each', 'cases', 'bags', 'boxes', 'liters', 'kg'];

const emptyItem = { name: '', category: 'dry_goods', quantity: '', unit: 'each', unit_cost: '', reorder_level: '', supplier: '' };

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.InventoryItem.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InventoryItem.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InventoryItem.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const openNew = () => { setEditItem(null); setForm(emptyItem); setDialogOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || '', category: item.category || 'dry_goods',
      quantity: item.quantity?.toString() || '', unit: item.unit || 'each',
      unit_cost: item.unit_cost?.toString() || '', reorder_level: item.reorder_level?.toString() || '',
      supplier: item.supplier || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const qty = parseFloat(form.quantity) || 0;
    const reorder = parseFloat(form.reorder_level) || 0;
    const data = { ...form, quantity: qty, unit_cost: parseFloat(form.unit_cost) || 0, reorder_level: reorder, is_low_stock: qty <= reorder };
    if (editItem) updateMutation.mutate({ id: editItem.id, data });
    else createMutation.mutate(data);
  };

  const filtered = items.filter(i =>
    (filterCat === 'all' || i.category === filterCat) &&
    (!showLowOnly || i.quantity <= (i.reorder_level || 0)) &&
    i.name?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter(i => i.quantity <= (i.reorder_level || 0)).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" subtitle={`${items.length} items tracked · ${lowStockCount} low stock`}>
        <Button variant={showLowOnly ? "destructive" : "outline"} onClick={() => setShowLowOnly(!showLowOnly)}>
          <AlertTriangle className="w-4 h-4 mr-2" />{showLowOnly ? 'Show All' : `Low Stock (${lowStockCount})`}
        </Button>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(item => {
              const isLow = item.quantity <= (item.reorder_level || 0);
              return (
                <TableRow key={item.id} className={isLow ? 'bg-destructive/5' : ''}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize text-xs">{item.category?.replace('_', ' ')}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{item.quantity} {item.unit}</TableCell>
                  <TableCell className="text-right">${item.unit_cost?.toFixed(2) || '—'}</TableCell>
                  <TableCell className="text-right font-medium">${((item.quantity || 0) * (item.unit_cost || 0)).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{item.supplier || '—'}</TableCell>
                  <TableCell>
                    {isLow ? (
                      <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Low</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-accent border-accent/30">OK</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No inventory items found</p>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">{editItem ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm({...form, unit: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} /></div>
              <div><Label>Unit Cost ($)</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm({...form, unit_cost: e.target.value})} /></div>
              <div><Label>Reorder At</Label><Input type="number" value={form.reorder_level} onChange={e => setForm({...form, reorder_level: e.target.value})} /></div>
            </div>
            <div><Label>Supplier</Label><Input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} /></div>
            <Button onClick={handleSave} className="w-full" disabled={!form.name}>{editItem ? 'Update' : 'Add Item'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}