import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PRESET_ADDONS = [
  { name: 'Full-Service Staffing', description: 'Servers, setup & breakdown crew', price: 150, unit: 'per staff/hr' },
  { name: 'Bartending Service', description: 'Licensed bartender + basic bar setup', price: 200, unit: 'flat' },
  { name: 'Beer & Wine Package', description: 'Curated beer and wine selection', price: 18, unit: 'per person' },
  { name: 'Signature Mocktail Bar', description: 'Non-alcoholic craft beverage station', price: 12, unit: 'per person' },
  { name: 'Lemonade & Sweet Tea Station', description: 'Candora house beverages, unlimited', price: 6, unit: 'per person' },
  { name: 'Disposable Servingware', description: 'Plates, utensils, napkins', price: 3, unit: 'per person' },
  { name: 'Chafing Dishes & Equipment', description: 'Full buffet setup with chafing dishes', price: 75, unit: 'flat' },
  { name: 'Event Coordination', description: 'On-site catering coordinator for the event', price: 250, unit: 'flat' },
];

export default function AddOnServices({ addons, onChange }) {
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const togglePreset = (preset) => {
    const exists = addons.find(a => a.name === preset.name);
    if (exists) {
      onChange(addons.filter(a => a.name !== preset.name));
    } else {
      onChange([...addons, { name: preset.name, description: preset.description, price: preset.price, quantity: 1 }]);
    }
  };

  const addCustom = () => {
    if (!customName || !customPrice) return;
    onChange([...addons, { name: customName, description: customDesc, price: parseFloat(customPrice) || 0, quantity: 1 }]);
    setCustomName(''); setCustomPrice(''); setCustomDesc(''); setShowCustom(false);
  };

  const updateQty = (idx, qty) => {
    const next = [...addons];
    next[idx] = { ...next[idx], quantity: parseInt(qty) || 1 };
    onChange(next);
  };

  const remove = (idx) => onChange(addons.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {/* Preset add-ons grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PRESET_ADDONS.map(preset => {
          const selected = addons.some(a => a.name === preset.name);
          return (
            <button
              key={preset.name}
              onClick={() => togglePreset(preset)}
              className={cn(
                'text-left p-3 rounded-lg border transition-all',
                selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{preset.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-bold text-primary">${preset.price}</p>
                  <p className="text-[10px] text-muted-foreground">{preset.unit}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected add-ons with qty */}
      {addons.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Selected Add-ons</Label>
          {addons.map((addon, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{addon.name}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <span>qty</span>
                <Input className="w-14 h-7 text-xs" type="number" min="1" value={addon.quantity} onChange={e => updateQty(idx, e.target.value)} />
              </div>
              <span className="text-sm font-bold w-16 text-right">${((addon.price || 0) * (addon.quantity || 1)).toFixed(2)}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive shrink-0" onClick={() => remove(idx)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      )}

      {/* Custom add-on */}
      {showCustom ? (
        <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <p className="text-sm font-medium">Custom Add-on</p>
          <Input placeholder="Service name" value={customName} onChange={e => setCustomName(e.target.value)} />
          <Input placeholder="Description (optional)" value={customDesc} onChange={e => setCustomDesc(e.target.value)} />
          <Input type="number" placeholder="Price ($)" value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={addCustom} disabled={!customName || !customPrice}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCustom(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowCustom(true)}>
          <Plus className="w-3 h-3 mr-1" /> Add Custom Service
        </Button>
      )}
    </div>
  );
}