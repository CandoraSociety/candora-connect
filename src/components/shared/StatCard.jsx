import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, className }) {
  return (
    <Card className={cn("p-5 relative overflow-hidden group hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold font-heading tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <p className={cn(
          "text-xs mt-3 font-medium",
          trend > 0 ? "text-accent" : "text-destructive"
        )}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
        </p>
      )}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
    </Card>
  );
}