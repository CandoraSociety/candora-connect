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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Trash2, Users, DollarSign, Package, Sparkles, Pencil } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PresetPackages, { PRESET_PACKAGES } from '../components/catering/PresetPackages';
import AddOnServices from '../components/catering/AddOnServices';

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
    preset_package: null,
    selected_items: [],
    addons: [],
    notes: '', status: 'draft',
  });

  // Custom item form state
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemNotes, setCustomItemNotes] = useState('');
  const [showCustomItem, setShowCustomItem] = useState(false);

  const { data: menuItems = [] } = useQuery({ queryKey: ['menuItems'], queryFn: () => base44.entities.MenuItem.list() });

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
        preset_package: existingQuote.preset_package || null,
        selected_items: existingQuote.selected_items || [],
        addons: existingQuote.addons || [],
        notes: existingQuote.notes || '',
        status: existingQuote.status || 'draft',
      });
    }
  }, [existingQuote]);

  // --- Menu item helpers ---
  const addMenuItem = (menuItem) => {
    const guestCount = parseInt(form.guest_count) || 1;
    const exists = form.selected_items.find(i => i.menu_item_id === menuItem.id);
    if (!exists) {
      setForm(f => ({
        ...f,
        selected_items: [...f.selected_items, {
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price_per_person: menuItem.price,
          quantity: guestCount,
          is_custom: false,
        }],
      }));
    }
  };

  const addCustomItem = () => {
    if (!customItemName || !customItemPrice) return;
    setForm(f => ({
      ...f,
      selected_items: [...f.selected_items, {
        menu_item_id: null,
        name: customItemName,
        price_per_person: parseFloat(customItemPrice) || 0,
        quantity: parseInt(form.guest_count) || 1,
        is_custom: true,
        notes: customItemNotes,
      }],
    }));
    setCustomItemName(''); setCustomItemPrice(''); setCustomItemNotes(''); setShowCustomItem(false);
  };

  const removeItem = (idx) => setForm(f => ({ ...f, selected_items: f.selected_items.filter((_, i) => i !== idx) }));
  const updateItemQty = (idx, qty) => {
    setForm(f => {
      const next = [...f.selected_items];
      next[idx] = { ...next[idx], quantity: parseInt(qty) || 0 };
      return { ...f, selected_items: next };
    });
  };
  const updateItemPrice = (idx, price) => {
    setForm(f => {
      const next = [...f.selected_items];
      next[idx] = { ...next[idx], price_per_person: parseFloat(price) || 0 };
      return { ...f, selected_items: next };
    });
  };

  // --- Preset package handler ---
  const handlePresetSelect = (pkg) => {
    if (!pkg) {
      setForm(f => ({ ...f, preset_package: null }));
      return;
    }
    const guestCount = parseInt(form.guest_count) || 1;
    const presetItems = pkg.items.map(name => ({
      menu_item_id: menuItems.find(m => m.name === name)?.id || null,
      name,
      price_per_person: pkg.price_per_person / pkg.items.length,
      quantity: guestCount,
      is_custom: false,
    }));
    setForm(f => ({ ...f, preset_package: pkg.name, selected_items: presetItems }));
  };

  const toggleDietary = (req) => {
    setForm(f => ({
      ...f,
      dietary_requirements: f.dietary_requirements.includes(req)
        ? f.dietary_requirements.filter(r => r !== req)
        : [...f.dietary_requirements, req],
    }));
  };

  // --- Totals ---
  const ingredientCostEstimate = useMemo(() => {
    let total = 0;
    form.selected_items.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.menu_item_id);
      if (menuItem?.cost) total += menuItem.cost * (item.quantity || 0);
    });
    return total;
  }, [form.selected_items, menuItems]);

  const itemsSubtotal = form.selected_items.reduce((s, i) => s + (i.price_per_person || 0) * (i.quantity || 0), 0);
  const addonsSubtotal = form.addons.reduce((s, a) => s + (a.price || 0) * (a.quantity || 1), 0);
  const subtotal = itemsSubtotal + addonsSubtotal;
  const serviceFee = itemsSubtotal * 0.18;
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

  const cateringItems = menuItems.filter(m => m.is_available !== false);

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

          {/* Menu & Add-ons Tabs */}
          <Card className="p-5">
            <Tabs defaultValue="menu">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold">Menu & Services</h2>
                <TabsList>
                  <TabsTrigger value="presets"><Sparkles className="w-3.5 h-3.5 mr-1.5" />Presets</TabsTrigger>
                  <TabsTrigger value="menu">Menu Items</TabsTrigger>
                  <TabsTrigger value="addons">Add-ons</TabsTrigger>
                </TabsList>
              </div>

              {/* Preset Packages */}
              <TabsContent value="presets">
                <PresetPackages selectedPackage={form.preset_package} onSelect={handlePresetSelect} />
              </TabsContent>

              {/* Individual Menu Items */}
              <TabsContent value="menu">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4">
                  {cateringItems.map(item => {
                    const selected = form.selected_items.some(i => i.menu_item_id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => !selected && addMenuItem(item)}
                        className={`flex justify-between items-center p-3 rounded-lg border text-left transition-all ${
                          selected ? 'bg-primary/10 border-primary/30 opacity-60' : 'hover:bg-muted'
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

                {/* Custom item entry */}
                {showCustomItem ? (
                  <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <p className="text-sm font-medium">Custom Menu Item</p>
                    <Input placeholder="Item name (e.g. Jerk Chicken, Vegan Platter)" value={customItemName} onChange={e => setCustomItemName(e.target.value)} />
                    <div className="flex gap-2">
                      <Input type="number" step="0.01" placeholder="Price per person ($)" value={customItemPrice} onChange={e => setCustomItemPrice(e.target.value)} />
                      <Input placeholder="Notes (optional)" value={customItemNotes} onChange={e => setCustomItemNotes(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addCustomItem} disabled={!customItemName || !customItemPrice}>Add Item</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowCustomItem(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setShowCustomItem(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Custom / Unlisted Item
                  </Button>
                )}
              </TabsContent>

              {/* Add-on Services */}
              <TabsContent value="addons">
                <AddOnServices addons={form.addons} onChange={addons => setForm(f => ({ ...f, addons }))} />
              </TabsContent>
            </Tabs>

            {/* Selected Items Summary (always visible) */}
            {(form.selected_items.length > 0 || form.addons.length > 0) && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Quote Line Items
                </Label>
                {form.selected_items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {item.is_custom && <Badge variant="outline" className="text-[10px]">custom</Badge>}
                      {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    </div>
                    <Input className="w-16 h-7 text-xs" type="number" value={item.quantity} onChange={e => updateItemQty(idx, e.target.value)} />
                    <span className="text-xs text-muted-foreground">×</span>
                    <Input className="w-20 h-7 text-xs" type="number" step="0.01" value={item.price_per_person} onChange={e => updateItemPrice(idx, e.target.value)} />
                    <span className="font-bold text-sm w-16 text-right">${((item.price_per_person || 0) * (item.quantity || 0)).toFixed(2)}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive shrink-0" onClick={() => removeItem(idx)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
                {form.addons.length > 0 && (
                  <p className="text-xs text-muted-foreground pt-1">+ {form.addons.length} add-on service(s) — see Add-ons tab</p>
                )}
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
              {form.preset_package && (
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium">{form.preset_package}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{form.guest_count || 0} guests</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span>{form.selected_items.length} items · {form.addons.length} add-ons</span>
              </div>

              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span>Menu Items</span><span>${itemsSubtotal.toFixed(2)}</span></div>
                {addonsSubtotal > 0 && <div className="flex justify-between"><span>Add-on Services</span><span>${addonsSubtotal.toFixed(2)}</span></div>}
                <div className="flex justify-between text-muted-foreground"><span>Service Fee (18%)</span><span>${serviceFee.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span className="text-primary">${total.toFixed(2)}</span></div>
              </div>

              {ingredientCostEstimate > 0 && (
                <div className="bg-accent/10 rounded-lg p-3">
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

              <div className="pt-1">
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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