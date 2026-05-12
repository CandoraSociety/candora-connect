import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
        <ShieldAlert className="w-7 h-7 text-destructive" />
      </div>
      <h2 className="text-xl font-heading font-bold">Access Restricted</h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        You don't have permission to view this page. Please contact your manager or admin if you need access.
      </p>
      <Button asChild variant="outline">
        <Link to="/recipes">Go to Recipes</Link>
      </Button>
    </div>
  );
}