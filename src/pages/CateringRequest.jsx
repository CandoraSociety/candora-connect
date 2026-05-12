import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ChefHat, UtensilsCrossed, Users, Calendar, Loader2 } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'birthday', label: 'Birthday Party' },
  { value: 'funeral', label: 'Repast / Funeral' },
  { value: 'holiday', label: 'Holiday Event' },
  { value: 'community', label: 'Community Event' },
  { value: 'fundraiser', label: 'Fundraiser' },
  { value: 'other', label: 'Other' },
];

const SERVICE_STYLES = [
  { value: 'buffet', label: 'Buffet' },
  { value: 'plated', label: 'Plated Dinner' },
  { value: 'family_style', label: 'Family Style' },
  { value: 'boxed_meals', label: 'Boxed Meals' },
  { value: 'food_stations', label: 'Food Stations' },
  { value: 'cocktail', label: 'Cocktail Reception' },
];

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Nut-Free', 'Dairy-Free', 'Low-Sodium'
];

const INITIAL_FORM = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  event_date: '',
  event_type: '',
  guest_count: '',
  service_style: '',
  dietary_requirements: [],
  notes: '',
};

export default function CateringRequest() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleDietary = (option) => {
    set('dietary_requirements', form.dietary_requirements.includes(option)
      ? form.dietary_requirements.filter(d => d !== option)
      : [...form.dietary_requirements, option]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.customer_name || !form.customer_email || !form.event_type || !form.guest_count) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    await base44.entities.CateringQuote.create({
      ...form,
      guest_count: parseInt(form.guest_count) || 0,
      status: 'draft',
    });
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-heading font-bold">Request Received!</h2>
          <p className="text-muted-foreground">
            Thank you, <strong>{form.customer_name}</strong>! We've received your catering request and will be in touch within 1–2 business days to discuss the details.
          </p>
          <p className="text-sm text-muted-foreground">Questions? Reach us at <a href="mailto:info@candorafoodservices.com" className="text-primary underline">info@candorafoodservices.com</a></p>
          <Button variant="outline" onClick={() => { setForm(INITIAL_FORM); setSubmitted(false); }}>
            Submit Another Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-sidebar text-sidebar-foreground py-10 px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold">Candora Food Services</span>
        </div>
        <h1 className="text-3xl font-heading font-bold mb-2">Request a Catering Quote</h1>
        <p className="text-sidebar-foreground/70 max-w-xl mx-auto text-sm">
          Tell us about your event and we'll put together a custom quote for you. No commitment required.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Contact Info */}
          <section className="space-y-4">
            <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" /> Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input placeholder="Jane Smith" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address <span className="text-destructive">*</span></Label>
                <Input type="email" placeholder="jane@example.com" value={form.customer_email} onChange={e => set('customer_email', e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Phone Number</Label>
                <Input type="tel" placeholder="(555) 000-0000" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Event Details */}
          <section className="space-y-4">
            <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Event Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Event Type <span className="text-destructive">*</span></Label>
                <Select value={form.event_type} onValueChange={v => set('event_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Event Date</Label>
                <Input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Expected Guest Count <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input className="pl-9" type="number" min="1" placeholder="50" value={form.guest_count} onChange={e => set('guest_count', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Service Style</Label>
                <Select value={form.service_style} onValueChange={v => set('service_style', v)}>
                  <SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Dietary */}
          <section className="space-y-3">
            <h2 className="text-lg font-heading font-semibold">Dietary Requirements</h2>
            <p className="text-sm text-muted-foreground">Select all that apply for your guests.</p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(option => {
                const selected = form.dietary_requirements.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleDietary(option)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selected ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted/60'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Tell us about your vision, any special requests, themes, or anything else we should know..."
              rows={4}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </section>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Quote Request'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By submitting this form, you agree to be contacted by Candora Food Services regarding your event.
          </p>
        </form>
      </div>
    </div>
  );
}