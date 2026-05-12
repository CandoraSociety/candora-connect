import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, BookOpen, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/shared/PageHeader';

const CATEGORIES = ['appetizer', 'entree', 'side', 'dessert', 'beverage', 'breakfast', 'sauce', 'base'];

export default function Recipes() {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list(),
  });

  const filtered = recipes.filter(r =>
    (filterCat === 'all' || r.category === filterCat) &&
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Recipe Book" subtitle="Your complete recipe collection">
        <Link to="/recipes/new"><Button><Plus className="w-4 h-4 mr-2" />New Recipe</Button></Link>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search recipes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(recipe => (
          <Link key={recipe.id} to={`/recipes/${recipe.id}`}>
            <Card className="p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full">
              {recipe.image_url && (
                <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-muted">
                  <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <Badge variant="secondary" className="capitalize text-xs mb-2">{recipe.category?.replace('_', ' ')}</Badge>
              <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors">{recipe.name}</h3>
              {recipe.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{recipe.description}</p>}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                {recipe.prep_time_minutes && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{recipe.prep_time_minutes + (recipe.cook_time_minutes || 0)} min</span>
                )}
                {recipe.servings && (
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{recipe.servings} servings</span>
                )}
                {recipe.ingredients?.length > 0 && (
                  <span>{recipe.ingredients.length} ingredients</span>
                )}
              </div>
              {recipe.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {recipe.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-heading">No recipes yet</p>
          <p className="text-sm mt-1">Start building your recipe collection</p>
        </div>
      )}
    </div>
  );
}