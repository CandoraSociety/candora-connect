import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PRESET_PACKAGES = [
  {
    name: 'Classic Soul Buffet',
    description: 'Our most popular package — hearty Southern comfort food for any occasion',
    items: ['Southern Fried Chicken', 'Mac & Cheese', 'Collard Greens', 'Cornbread Muffins'],
    price_per_person: 28,
    tags: ['popular'],
  },
  {
    name: 'Community Plate',
    description: 'Budget-friendly option great for community events and fundraisers',
    items: ['BBQ Pulled Pork Sandwich', 'Collard Greens', 'Cornbread Muffins'],
    price_per_person: 18,
    tags: ['budget'],
  },
  {
    name: 'Full Spread',
    description: 'Appetizers, mains, sides, desserts — the complete Candora experience',
    items: ['Southern Fried Chicken', 'Grilled Catfish', 'Mac & Cheese', 'Collard Greens', 'Cornbread Muffins', 'Sweet Potato Pie', 'Peach Cobbler'],
    price_per_person: 48,
    tags: ['premium'],
  },
  {
    name: 'Breakfast Spread',
    description: 'Morning events and brunches',
    items: ['Breakfast Plate', 'Cornbread Muffins', 'Fresh Squeezed Lemonade'],
    price_per_person: 22,
    tags: ['breakfast'],
  },
];

export default function PresetPackages({ selectedPackage, onSelect }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">Choose a preset to auto-populate menu items, or build your own below.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRESET_PACKAGES.map(pkg => {
          const isSelected = selectedPackage === pkg.name;
          return (
            <button
              key={pkg.name}
              onClick={() => onSelect(isSelected ? null : pkg)}
              className={cn(
                'text-left p-4 rounded-xl border-2 transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{pkg.name}</p>
                    {pkg.tags.map(t => (
                      <Badge key={t} variant="secondary" className="text-[10px] capitalize">{t}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{pkg.description}</p>
                  <p className="text-xs text-muted-foreground">{pkg.items.join(' · ')}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="font-bold text-primary">${pkg.price_per_person}<span className="text-xs font-normal text-muted-foreground">/pp</span></span>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}