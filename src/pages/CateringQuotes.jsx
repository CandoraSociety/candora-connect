import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Calculator, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';

const STATUS_COLORS = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
};

export default function CateringQuotes() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: quotes = [] } = useQuery({
    queryKey: ['cateringQuotes'],
    queryFn: () => base44.entities.CateringQuote.list('-created_date'),
  });

  const filtered = quotes.filter(q =>
    (filterStatus === 'all' || q.status === filterStatus) &&
    (q.customer_name?.toLowerCase().includes(search.toLowerCase()) || q.event_type?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Catering Quotes" subtitle="Build and manage catering quotes">
        <Link to="/catering/new"><Button><Plus className="w-4 h-4 mr-2" />New Quote</Button></Link>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search quotes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map(quote => (
          <Link key={quote.id} to={`/catering/new?edit=${quote.id}`}>
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer mb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold">{quote.customer_name}</h3>
                    <Badge className={`${STATUS_COLORS[quote.status || 'draft']} text-xs capitalize`}>{quote.status || 'draft'}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="capitalize">{quote.event_type?.replace('_', ' ')}</span>
                    {quote.event_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(quote.event_date), 'MMM d, yyyy')}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{quote.guest_count} guests</span>
                  </div>
                </div>
                <p className="text-2xl font-heading font-bold text-primary">${quote.total?.toFixed(2) || '0.00'}</p>
              </div>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Calculator className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-heading">No quotes yet</p>
            <p className="text-sm mt-1">Create your first catering quote</p>
          </div>
        )}
      </div>
    </div>
  );
}