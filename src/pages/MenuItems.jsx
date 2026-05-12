import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';

const CATEGORIES = ['appetizer', 'entree', 'side', 'dessert', 'beverage', 'breakfast', 'lunch_special', 'catering'];

const emptyItem = { name: '', description: '', category: 'entree', price: '', cost: '', is_available: true, tags: [] };

export default function MenuItems() {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MenuItem.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['menuItems'] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuItem.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['menuItems'] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MenuItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menuItems'] }),
  });

  const openNew = () => { setEditItem(null); setForm(emptyItem); setDialogOpen(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item, price: item.price?.toString() || '', cost: item.cost?.toString() || '' }); setDialogOpen(true); };

  const handleSave = () => {
    const data = { ...form, price: parseFloat(form.price) || 0, cost: parseFloat(form.cost) || 0 };
    if (editItem) updateMutation.mutate({ id: editItem.id, data });
    else createMutation.mutate(data);
  };

  const filtered = items.filter(i =>
    (filterCat === 'all' || i.category === filterCat) &&
    i.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Menu Items" subtitle="Manage your food and beverage offerings">
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <Card key={item.id} className="p-4 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold">{item.name}</h3>
                  {!item.is_available && <Badge variant="destructive" className="text-[10px]">Unavailable</Badge>}
                </div>
                <Badge variant="secondary" className="capitalize mt-1 text-xs">{item.category?.replace('_', ' ')}</Badge>
                {item.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.description}</p>}
              </div>
              <p className="text-xl font-bold font-heading text-primary">${item.price?.toFixed(2)}</p>
            </div>
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {item.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
              </div>
            )}
            <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="outline" onClick={() => openEdit(item)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editItem ? 'Edit Item' : 'New Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_available} onCheckedChange={v => setForm({...form, is_available: v})} />
                <Label>Available</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
              <div><Label>Cost ($)</Label><Input type="number" step="0.01" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} /></div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!form.name || !form.price}>
              {editItem ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}