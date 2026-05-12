import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Users, ChefHat, Lightbulb, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function RecipeDetail() {
  const params = new URLSearchParams(window.location.search);
  const recipeId = window.location.pathname.split('/recipes/')[1];

  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [activeStep, setActiveStep] = useState(0);
  const [cookingMode, setCookingMode] = useState(false);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: async () => {
      const recipes = await base44.entities.Recipe.filter({ id: recipeId });
      return recipes[0];
    },
    enabled: !!recipeId,
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!recipe) return <div className="text-center py-20">Recipe not found</div>;

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  const steps = recipe.steps || [];
  const ingredients = recipe.ingredients || [];
  const progress = steps.length > 0 ? (completedSteps.size / steps.length) * 100 : 0;

  const toggleIngredient = (idx) => {
    const next = new Set(checkedIngredients);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setCheckedIngredients(next);
  };

  const toggleStep = (idx) => {
    const next = new Set(completedSteps);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setCompletedSteps(next);
    if (!next.has(idx) && activeStep === idx) return;
    if (next.has(idx) && idx < steps.length - 1) setActiveStep(idx + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/recipes">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-heading font-bold">{recipe.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="secondary" className="capitalize">{recipe.category?.replace('_', ' ')}</Badge>
            {totalTime > 0 && <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{totalTime} min</span>}
            {recipe.servings && <span className="text-sm text-muted-foreground flex items-center gap-1"><Users className="w-3.5 h-3.5" />{recipe.servings} servings</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/recipes/new?edit=${recipeId}`}><Button variant="outline" size="sm"><Pencil className="w-3.5 h-3.5 mr-1.5" />Edit</Button></Link>
          <Button size="sm" onClick={() => setCookingMode(!cookingMode)} className={cookingMode ? 'bg-accent hover:bg-accent/90' : ''}>
            <ChefHat className="w-3.5 h-3.5 mr-1.5" />{cookingMode ? 'Exit Cooking Mode' : 'Start Cooking'}
          </Button>
        </div>
      </div>

      {recipe.description && <p className="text-muted-foreground">{recipe.description}</p>}

      {/* Progress bar in cooking mode */}
      {cookingMode && steps.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Cooking Progress</span>
            <span className="text-sm text-muted-foreground">{completedSteps.size}/{steps.length} steps</span>
          </div>
          <Progress value={progress} className="h-2" />
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredients */}
        <Card className="p-5">
          <h2 className="font-heading font-semibold text-lg mb-4">Ingredients</h2>
          <div className="space-y-3">
            {ingredients.map((ing, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox checked={checkedIngredients.has(idx)} onCheckedChange={() => toggleIngredient(idx)} />
                <span className={cn("text-sm transition-all", checkedIngredients.has(idx) && "line-through text-muted-foreground")}>
                  {ing.amount && <span className="font-medium">{ing.amount} {ing.unit} </span>}
                  {ing.name}
                </span>
              </label>
            ))}
            {ingredients.length === 0 && <p className="text-sm text-muted-foreground">No ingredients listed</p>}
          </div>
        </Card>

        {/* Steps */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-heading font-semibold text-lg">Instructions</h2>
          <AnimatePresence>
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className={cn(
                    "p-5 cursor-pointer transition-all duration-300",
                    cookingMode && activeStep === idx && "ring-2 ring-primary shadow-lg",
                    completedSteps.has(idx) && "opacity-60"
                  )}
                  onClick={() => { setActiveStep(idx); if (cookingMode) toggleStep(idx); }}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors",
                      completedSteps.has(idx) ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"
                    )}>
                      {completedSteps.has(idx) ? '✓' : step.step_number || idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-sm leading-relaxed", completedSteps.has(idx) && "line-through")}>{step.instruction}</p>
                      {step.duration_minutes && (
                        <span className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{step.duration_minutes} min
                        </span>
                      )}
                      {step.tip && (
                        <div className="mt-3 p-3 bg-primary/5 rounded-lg flex gap-2">
                          <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">{step.tip}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {steps.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground">
              <ChefHat className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No instructions added yet</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}