import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/shared/PageHeader';

const CATEGORIES = ['appetizer', 'entree', 'side', 'dessert', 'beverage', 'breakfast', 'sauce', 'base'];

export default function RecipeEditor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editId = new URLSearchParams(window.location.search).get('edit');

  const [form, setForm] = useState({
    name: '', description: '', category: 'entree', servings: '', prep_time_minutes: '', cook_time_minutes: '',
    ingredients: [{ name: '', amount: '', unit: '' }],
    steps: [{ step_number: 1, instruction: '', duration_minutes: '', tip: '' }],
    tags: [],
    image_url: '',
  });

  const { data: existingRecipe } = useQuery({
    queryKey: ['recipe', editId],
    queryFn: async () => {
      const recipes = await base44.entities.Recipe.filter({ id: editId });
      return recipes[0];
    },
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingRecipe) {
      setForm({
        name: existingRecipe.name || '',
        description: existingRecipe.description || '',
        category: existingRecipe.category || 'entree',
        servings: existingRecipe.servings?.toString() || '',
        prep_time_minutes: existingRecipe.prep_time_minutes?.toString() || '',
        cook_time_minutes: existingRecipe.cook_time_minutes?.toString() || '',
        ingredients: existingRecipe.ingredients?.length ? existingRecipe.ingredients : [{ name: '', amount: '', unit: '' }],
        steps: existingRecipe.steps?.length ? existingRecipe.steps : [{ step_number: 1, instruction: '', duration_minutes: '', tip: '' }],
        tags: existingRecipe.tags || [],
        image_url: existingRecipe.image_url || '',
      });
    }
  }, [existingRecipe]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editId) return base44.entities.Recipe.update(editId, data);
      return base44.entities.Recipe.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate('/recipes');
    },
  });

  const handleSave = () => {
    const data = {
      ...form,
      servings: parseInt(form.servings) || undefined,
      prep_time_minutes: parseInt(form.prep_time_minutes) || undefined,
      cook_time_minutes: parseInt(form.cook_time_minutes) || undefined,
      ingredients: form.ingredients.filter(i => i.name),
      steps: form.steps.filter(s => s.instruction).map((s, i) => ({ ...s, step_number: i + 1, duration_minutes: parseInt(s.duration_minutes) || undefined })),
    };
    saveMutation.mutate(data);
  };

  const addIngredient = () => setForm({ ...form, ingredients: [...form.ingredients, { name: '', amount: '', unit: '' }] });
  const removeIngredient = (idx) => setForm({ ...form, ingredients: form.ingredients.filter((_, i) => i !== idx) });
  const updateIngredient = (idx, field, value) => {
    const next = [...form.ingredients];
    next[idx] = { ...next[idx], [field]: value };
    setForm({ ...form, ingredients: next });
  };

  const addStep = () => setForm({ ...form, steps: [...form.steps, { step_number: form.steps.length + 1, instruction: '', duration_minutes: '', tip: '' }] });
  const removeStep = (idx) => setForm({ ...form, steps: form.steps.filter((_, i) => i !== idx) });
  const updateStep = (idx, field, value) => {
    const next = [...form.steps];
    next[idx] = { ...next[idx], [field]: value };
    setForm({ ...form, steps: next });
  };

  const [tagInput, setTagInput] = useState('');
  const addTag = () => {
    if (tagInput && !form.tags.includes(tagInput)) {
      setForm({ ...form, tags: [...form.tags, tagInput] });
      setTagInput('');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/recipes"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="text-2xl font-heading font-bold">{editId ? 'Edit Recipe' : 'New Recipe'}</h1>
      </div>

      {/* Basic Info */}
      <Card className="p-5 space-y-4">
        <div><Label>Recipe Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Southern Fried Chicken" /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><Label>Category</Label>
            <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Servings</Label><Input type="number" value={form.servings} onChange={e => setForm({...form, servings: e.target.value})} /></div>
          <div><Label>Prep (min)</Label><Input type="number" value={form.prep_time_minutes} onChange={e => setForm({...form, prep_time_minutes: e.target.value})} /></div>
          <div><Label>Cook (min)</Label><Input type="number" value={form.cook_time_minutes} onChange={e => setForm({...form, cook_time_minutes: e.target.value})} /></div>
        </div>
        <div>
          <Label>Tags</Label>
          <div className="flex gap-2 flex-wrap mt-1">
            {form.tags.map(t => (
              <span key={t} className="bg-muted px-2 py-1 rounded text-xs flex items-center gap-1">
                {t}<button onClick={() => setForm({...form, tags: form.tags.filter(tag => tag !== t)})} className="text-muted-foreground hover:text-destructive">×</button>
              </span>
            ))}
            <div className="flex gap-1">
              <Input className="h-7 w-32 text-xs" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag..." />
              <Button size="sm" variant="outline" className="h-7" onClick={addTag}>+</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Ingredients */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold">Ingredients</h2>
          <Button size="sm" variant="outline" onClick={addIngredient}><Plus className="w-3 h-3 mr-1" />Add</Button>
        </div>
        <div className="space-y-2">
          {form.ingredients.map((ing, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input className="w-20" placeholder="Amt" value={ing.amount} onChange={e => updateIngredient(idx, 'amount', e.target.value)} />
              <Input className="w-20" placeholder="Unit" value={ing.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)} />
              <Input className="flex-1" placeholder="Ingredient name" value={ing.name} onChange={e => updateIngredient(idx, 'name', e.target.value)} />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeIngredient(idx)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Steps */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold">Instructions</h2>
          <Button size="sm" variant="outline" onClick={addStep}><Plus className="w-3 h-3 mr-1" />Add Step</Button>
        </div>
        <div className="space-y-4">
          {form.steps.map((step, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold mt-1">{idx + 1}</div>
              <div className="flex-1 space-y-2">
                <Textarea placeholder="Describe this step..." value={step.instruction} onChange={e => updateStep(idx, 'instruction', e.target.value)} className="min-h-[80px]" />
                <div className="flex gap-2">
                  <Input className="w-28" type="number" placeholder="Minutes" value={step.duration_minutes} onChange={e => updateStep(idx, 'duration_minutes', e.target.value)} />
                  <Input className="flex-1" placeholder="Pro tip (optional)" value={step.tip} onChange={e => updateStep(idx, 'tip', e.target.value)} />
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive mt-1" onClick={() => removeStep(idx)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3 justify-end pb-8">
        <Link to="/recipes"><Button variant="outline">Cancel</Button></Link>
        <Button onClick={handleSave} disabled={!form.name}>{editId ? 'Update Recipe' : 'Save Recipe'}</Button>
      </div>
    </div>
  );
}