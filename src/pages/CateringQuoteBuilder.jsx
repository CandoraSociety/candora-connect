import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Trash2, Users, DollarSign, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const EVENT_TYPES = ['corporate', 'wedding', 'birthday', 'funeral', 'holiday', 'community', 'fundraiser', 'other'];
const SERVICE_STYLES = ['buffet', 'plated', 'family_style', 'boxed_meals', 'food_stations', 'cocktail'];
const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free', 'halal', 'kosher'];

export default function CateringQuoteBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editId = new URLSearchParams(window.location.search).get('edit');

  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    event_date: '', event_type: 'corporate', guest_count: '',
    service_style: 'buffet', dietary_requirements: [],
    selected_items: [], notes: '', status: 'draft',
  });

  const { data: menuItems = [] } = useQuery({ queryKey: ['menuItems'], queryFn: () => base44.entities.MenuItem.list() });
  const { data: inventory = [] } = useQuery({ queryKey: ['inventory'], queryFn: () => base44.entities.InventoryItem.list() });

  const { data: existingQuote } = useQuery({
    queryKey: ['quote', editId],
    queryFn: async () => { const q = await base44.entities.CateringQuote.filter({ id: editId }); return q[0]; },
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingQuote) {
      setForm({
        customer_name: existingQuote.customer_name || '',
        customer_email: existingQuote.customer_email || '',
        customer_phone: existingQuote.customer_phone || '',
        event_date: existingQuote.event_date || '',
        event_type: existingQuote.event_type || 'corporate',
        guest_count: existingQuote.guest_count?.toString() || '',
        service_style: existingQuote.service_style || 'buffet',
        dietary_requirements: existingQuote.dietary_requirements || [],
        selected_items: existingQuote.selected_items || [],
        notes: existingQuote.notes || '',
        status: existingQuote.status || 'draft',
      });
    }
  }, [existingQuote]);

  const cateringItems = menuItems.filter(m => m.is_available !== false);

  const addItem = (menuItem) => {
    const guestCount = parseInt(form.guest_count) || 1;
    const exists = form.selected_items.find(i => i.menu_item_id === menuItem.id);
    if (!exists) {
      setForm({
        ...form,
        selected_items: [...form.selected_items, {
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price_per_person: menuItem.price,
          quantity: guestCount,
        }],
      });
    }
  };

  const removeItem = (idx) => setForm({ ...form, selected_items: form.selected_items.filter((_, i) => i !== idx) });

  const updateItemQty = (idx, qty) => {
    const next = [...form.selected_items];
    next[idx] = { ...next[idx], quantity: parseInt(qty) || 0 };
    setForm({ ...form, selected_items: next });
  };

  const toggleDietary = (req) => {
    const next = form.dietary_requirements.includes(req)
      ? form.dietary_requirements.filter(r => r !== req)
      : [...form.dietary_requirements, req];
    setForm({ ...form, dietary_requirements: next });
  };

  // Calculate real-time ingredient cost estimate
  const ingredientCostEstimate = useMemo(() => {
    let total = 0;
    form.selected_items.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.menu_item_id);
      if (menuItem?.cost) total += menuItem.cost * (item.quantity || 0);
    });
    return total;
  }, [form.selected_items, menuItems]);

  const subtotal = form.selected_items.reduce((s, i) => s + (i.price_per_person || 0) * (i.quantity || 0), 0);
  const serviceFee = subtotal * 0.18; // 18% service fee
  const total = subtotal + serviceFee;

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editId) return base44.entities.CateringQuote.update(editId, data);
      return base44.entities.CateringQuote.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cateringQuotes'] });
      navigate('/catering');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      guest_count: parseInt(form.guest_count) || 0,
      estimated_ingredient_cost: ingredientCostEstimate,
      subtotal,
      service_fee: serviceFee,
      total,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/catering"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="text-2xl font-heading font-bold">{editId ? 'Edit Quote' : 'New Catering Quote'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client Info */}
          <Card className="p-5 space-y-4">
            <h2 className="font-heading font-semibold">Client Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label>Name</Label><Input value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} /></div>
              <div><Label>Email</Label><Input value={form.customer_email} onChange={e => setForm({...form, customer_email: e.target.value})} /></div>
              <div><Label>Phone</Label><Input value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} /></div>
            </div>
          </Card>

          {/* Event Details */}
          <Card className="p-5 space-y-4">
            <h2 className="font-heading font-semibold">Event Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label>Event Type</Label>
                <Select value={form.event_type} onValueChange={v => setForm({...form, event_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} /></div>
              <div><Label>Guests</Label><Input type="number" value={form.guest_count} onChange={e => setForm({...form, guest_count: e.target.value})} /></div>
              <div><Label>Service Style</Label>
                <Select value={form.service_style} onValueChange={v => setForm({...form, service_style: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICE_STYLES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Dietary Requirements</Label>
              <div className="flex flex-wrap gap-3">
                {DIETARY_OPTIONS.map(d => (
                  <label key={d} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={form.dietary_requirements.includes(d)} onCheckedChange={() => toggleDietary(d)} />
                    <span className="text-sm capitalize">{d.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </Card>

          {/* Menu Selection */}
          <Card className="p-5">
            <h2 className="font-heading font-semibold mb-4">Menu Selection</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {cateringItems.map(item => {
                const selected = form.selected_items.some(i => i.menu_item_id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => !selected && addItem(item)}
                    className={`flex justify-between items-center p-3 rounded-lg border text-left transition-all ${
                      selected ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted'
                    }`}
                    disabled={selected}
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <Badge variant="outline" className="text-[10px] capitalize mt-0.5">{item.category?.replace('_', ' ')}</Badge>
                    </div>
                    <span className="font-bold text-sm">${item.price?.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Items */}
            {form.selected_items.length > 0 && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <Label>Selected Items</Label>
                {form.selected_items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                    <div className="flex-1"><p className="text-sm font-medium">{item.name}</p></div>
                    <Input className="w-20 h-8 text-sm" type="number" value={item.quantity} onChange={e => updateItemQty(idx, e.target.value)} />
                    <span className="text-sm">× ${item.price_per_person?.toFixed(2)}</span>
                    <span className="font-bold text-sm w-20 text-right">${((item.price_per_person || 0) * (item.quantity || 0)).toFixed(2)}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(idx)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Additional notes or requirements..." /></div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <Card className="p-5 sticky top-8">
            <h2 className="font-heading font-semibold mb-4">Quote Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{form.guest_count || 0} guests</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span>{form.selected_items.length} menu items</span>
              </div>

              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Service Fee (18%)</span><span>${serviceFee.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span className="text-primary">${total.toFixed(2)}</span></div>
              </div>

              {ingredientCostEstimate > 0 && (
                <div className="bg-accent/10 rounded-lg p-3 mt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span className="font-medium">Est. Ingredient Cost</span>
                  </div>
                  <p className="text-lg font-bold text-accent mt-1">${ingredientCostEstimate.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Based on current inventory pricing</p>
                  {subtotal > 0 && (
                    <p className="text-xs text-accent mt-1">
                      Margin: {((1 - ingredientCostEstimate / subtotal) * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full" disabled={!form.customer_name || !form.guest_count}>
                {editId ? 'Update Quote' : 'Save Quote'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}