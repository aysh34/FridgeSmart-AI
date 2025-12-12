import React, { useState, useEffect } from 'react';
import { InventoryItem, Recipe } from '../types';
import { generateRecipesFromInventory, generateRescueRecipes } from '../services/geminiService';
import { Loader2, ChefHat, Clock, Flame, AlertTriangle, Zap, Utensils, Star, ArrowRight, TrendingUp, Check, PlayCircle, Circle, CheckCircle2, Cpu, Database, BrainCircuit, Search, Calculator, Sparkles, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecipeGeneratorProps {
  inventory: InventoryItem[];
  initialMode?: 'default' | 'rescue';
}

export const RecipeGenerator: React.FC<RecipeGeneratorProps> = ({ inventory, initialMode = 'default' }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState<string | null>(null);
  const [mode, setMode] = useState<'default' | 'rescue'>(initialMode);
  
  // Loading State Animation
  const [loadingStep, setLoadingStep] = useState(0);

  // Track checked ingredients/steps per recipe
  const [checkedState, setCheckedState] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    if (initialMode === 'rescue' && inventory.length > 0) handleGenerate('rescue');
  }, [initialMode]);

  // Loading Steps configuration
  const LOADING_STEPS = [
      { text: "Analyzing Inventory Context", icon: <Database className="w-5 h-5 text-blue-400" /> },
      { text: "Identifying Expiration Risks", icon: <AlertTriangle className="w-5 h-5 text-red-400" /> },
      { text: "Solving Nutritional Constraints", icon: <Calculator className="w-5 h-5 text-purple-400" /> },
      { text: "Optimizing Flavor Profiles", icon: <ChefHat className="w-5 h-5 text-emerald-400" /> },
      { text: "Generating Final Menu", icon: <Sparkles className="w-5 h-5 text-amber-400" /> }
  ];

  useEffect(() => {
      if (loading) {
          setLoadingStep(0);
          const interval = setInterval(() => {
              setLoadingStep(prev => {
                  if (prev >= LOADING_STEPS.length - 1) return prev;
                  return prev + 1;
              });
          }, 1500); // Advance every 1.5 seconds to match typical API latency
          return () => clearInterval(interval);
      }
  }, [loading]);

  const handleGenerate = async (targetMode: 'default' | 'rescue') => {
    if (inventory.length === 0) return alert("Add items to your inventory first!");
    setLoading(true);
    setMode(targetMode);
    setExpandedRecipe(null);
    setRecipes([]);
    
    if (targetMode === 'rescue') {
       confetti({ particleCount: 200, spread: 120, colors: ['#ef4444', '#f97316', '#fbbf24'] });
    }

    try {
      const generated = targetMode === 'rescue' 
        ? await generateRescueRecipes(inventory) 
        : await generateRecipesFromInventory(inventory);
      setRecipes(generated);
    } catch (e) {
      alert("Could not generate recipes.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (recipeId: string, itemId: string) => {
      setCheckedState(prev => ({
          ...prev,
          [recipeId]: {
              ...prev[recipeId],
              [itemId]: !prev[recipeId]?.[itemId]
          }
      }));
  };

  const getFoodImage = (title: string) => {
    const ids = ["1546069901107-37f904815f0d", "1540189549336-e6e99c3abd90", "1565299624946-b28f40a0ae38", "1567620905732-2d1ec7ab7445"];
    const hash = title.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    return `https://images.unsplash.com/photo-${ids[Math.abs(hash) % ids.length]}?auto=format&fit=crop&w=800&q=80`;
  }

  return (
    <div className={`pb-32 pt-6 min-h-full transition-colors duration-500 ${mode === 'rescue' ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="px-6 flex flex-col gap-2 mb-8">
        <h2 className={`text-3xl font-black flex items-center gap-3 tracking-tighter ${mode === 'rescue' ? 'text-white' : 'text-gray-900'}`}>
           {mode === 'rescue' ? '🚨 Rescue Mode' : 'Chef AI'}
        </h2>
        <p className={`font-medium text-lg ${mode === 'rescue' ? 'text-red-200' : 'text-gray-500'}`}>
          {mode === 'rescue' ? 'Emergency waste prevention protocol.' : 'Professional culinary optimization.'}
        </p>
      </div>

      {recipes.length === 0 && !loading && (
        <div className={`mx-4 text-center py-16 px-8 rounded-[3rem] shadow-xl relative overflow-hidden transition-all duration-500 ${mode === 'rescue' ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-red-500/30' : 'bg-white border border-gray-100'}`}>
           <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 transition-transform duration-700 ${mode === 'rescue' ? 'bg-red-500/20 animate-pulse' : 'bg-emerald-50'}`}>
              {mode === 'rescue' ? <Zap className="w-16 h-16 text-red-500" /> : <ChefHat className="w-16 h-16 text-emerald-600" />}
           </div>
           
           <h3 className={`text-3xl font-black mb-4 ${mode === 'rescue' ? 'text-white' : 'text-gray-900'}`}>
              {mode === 'rescue' ? 'Emergency Protocol' : 'Ready to cook?'}
           </h3>
           
           <button
                onClick={() => handleGenerate('rescue')}
                className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-orange-500 text-white px-8 py-7 rounded-3xl font-black shadow-[0_15px_40px_-10px_rgba(239,68,68,0.5)] w-full flex items-center justify-center gap-4 text-xl animate-pulse-glow hover:scale-[1.02] transition-transform"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <AlertTriangle className="w-8 h-8" /> 
                <span className="relative z-10 tracking-widest">RESCUE FOOD</span>
            </button>
            
            <button
                onClick={() => handleGenerate('default')}
                className={`mt-4 px-8 py-4 rounded-2xl font-bold w-full flex items-center justify-center gap-2 ${mode === 'rescue' ? 'text-gray-400 hover:text-white' : 'bg-white border-2 border-gray-100 text-gray-600'}`}
            >
                <Utensils className="w-5 h-5" /> Standard Menu
            </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="relative w-24 h-24 mb-10">
             <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
             <div className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${mode === 'rescue' ? 'border-red-500' : 'border-emerald-500'}`}></div>
             <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                <BrainCircuit className={`w-10 h-10 ${mode === 'rescue' ? 'text-red-500' : 'text-emerald-500'}`} />
             </div>
          </div>
          
          <div className="w-full max-w-xs space-y-4">
              {LOADING_STEPS.map((step, idx) => {
                  const isActive = idx === loadingStep;
                  const isCompleted = idx < loadingStep;
                  const isPending = idx > loadingStep;

                  return (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-3 transition-all duration-300 ${
                            isPending ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
                        }`}
                      >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                              isCompleted ? 'bg-emerald-500 text-white' : 
                              isActive ? (mode === 'rescue' ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-600 animate-pulse') : 
                              'bg-gray-100 text-gray-300'
                          }`}>
                              {isCompleted ? <Check className="w-4 h-4" /> : step.icon}
                          </div>
                          <span className={`font-bold text-sm ${
                              isActive ? (mode === 'rescue' ? 'text-white' : 'text-gray-900') : 
                              (mode === 'rescue' ? 'text-gray-500' : 'text-gray-400')
                          }`}>
                              {step.text}...
                          </span>
                      </div>
                  );
              })}
          </div>

          <div className={`mt-10 text-xs font-mono px-3 py-1 rounded border ${
              mode === 'rescue' ? 'bg-red-900/20 text-red-300 border-red-500/20' : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
             Gemini 3 Pro: Processing Multi-Constraint Optimization
          </div>
        </div>
      )}

      <div className="space-y-8 px-4 pb-20">
        {recipes.map((recipe, index) => (
          <div 
            key={recipe.id} 
            onClick={(e) => {
                if((e.target as HTMLElement).closest('button.checkbox') || (e.target as HTMLElement).closest('button.technical')) return;
                setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id);
            }}
            className={`rounded-[2.5rem] shadow-card overflow-hidden group animate-slide-up relative cursor-pointer transition-all duration-300 ${
                mode === 'rescue' ? 'bg-gray-800 ring-1 ring-red-500/30' : 'bg-white ring-1 ring-gray-100'
            } ${expandedRecipe === recipe.id ? 'scale-[1.02] shadow-2xl z-10' : 'hover:scale-[1.01]'}`}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="h-64 w-full relative overflow-hidden">
                 <img src={getFoodImage(recipe.title)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                 
                 <div className="absolute top-5 right-5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-4 py-2 rounded-full font-black shadow-lg flex items-center gap-1 transform rotate-3 scale-110">
                    <span className="text-xs opacity-90">SAVES</span>
                    <span className="text-xl">${recipe.savings.toFixed(2)}</span>
                 </div>

                 <div className="absolute bottom-6 left-6 right-6">
                     <h3 className="text-2xl font-black text-white leading-tight mb-2 drop-shadow-md">{recipe.title}</h3>
                     <div className="flex gap-3 text-white/90 text-sm font-medium">
                        <span className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg backdrop-blur-sm"><Clock className="w-4 h-4" /> {recipe.totalTime}</span>
                        <span className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg backdrop-blur-sm"><Flame className="w-4 h-4 text-orange-400" /> {recipe.macros.calories} cal</span>
                     </div>
                 </div>
            </div>

            {expandedRecipe === recipe.id && (
              <div className={`p-6 animate-slide-up ${mode === 'rescue' ? 'text-gray-300' : 'text-gray-600'}`}>
                {recipe.criticalItemsUsed.length > 0 && (
                   <div className="mb-8 bg-red-500/10 p-5 rounded-3xl border border-red-500/20 flex gap-4 items-start">
                      <div className="bg-red-500/20 p-2 rounded-full shrink-0">
                         <AlertTriangle className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">MISSION CRITICAL</p>
                         <p className="text-base font-medium leading-relaxed">Rescues: <span className="text-red-400 font-bold">{recipe.criticalItemsUsed.join(", ")}</span></p>
                      </div>
                   </div>
                )}
                
                <h4 className="font-bold mb-4 flex gap-2 items-center text-lg"><Utensils className="w-5 h-5 text-emerald-500" /> Ingredients</h4>
                <ul className="space-y-3 mb-8">
                   {recipe.ingredients.map((ing, i) => {
                      const isChecked = checkedState[recipe.id]?.[`ing-${i}`];
                      return (
                      <li key={i} className="flex items-start gap-3">
                         <button 
                            className={`checkbox mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}
                            onClick={() => toggleCheck(recipe.id, `ing-${i}`)}
                         >
                            {isChecked && <Check className="w-3 h-3 text-white" />}
                         </button>
                         <div className={isChecked ? 'opacity-50 line-through' : ''}>
                             <span className={`font-bold ${mode === 'rescue' ? 'text-white' : 'text-gray-900'}`}>{ing.amount} {ing.name}</span>
                             {ing.isInInventory && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">In Stock</span>}
                             {!ing.isInInventory && <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Buy</span>}
                         </div>
                      </li>
                   )})}
                </ul>

                <h4 className="font-bold mb-4 flex gap-2 items-center text-lg"><ChefHat className="w-5 h-5 text-emerald-500" /> Instructions</h4>
                <div className="space-y-6">
                    {recipe.instructions.map((inst, i) => (
                        <div key={i} className="flex gap-4">
                           <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${mode === 'rescue' ? 'bg-gray-700 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                              {i + 1}
                           </div>
                           <div>
                              <p className={`mb-2 leading-relaxed ${mode === 'rescue' ? 'text-white' : 'text-gray-800'}`}>{inst.text}</p>
                              {inst.tip && (
                                 <p className={`text-sm italic flex gap-2 items-center ${mode === 'rescue' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                    <Lightbulb className="w-4 h-4" /> Chef's Tip: {inst.tip}
                                 </p>
                              )}
                           </div>
                        </div>
                    ))}
                </div>

                {/* AI Technical Details Section */}
                {recipe.aiTechnicalData && (
                    <div className="mt-8 border-t border-dashed border-gray-300/30 pt-4">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTechnical(showTechnical === recipe.id ? null : recipe.id);
                            }}
                            className="technical flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-emerald-500 transition-colors w-full"
                        >
                            <Cpu className="w-4 h-4" /> 
                            {showTechnical === recipe.id ? 'Hide AI Logic' : 'View AI Optimization Logic'}
                        </button>
                        
                        {showTechnical === recipe.id && (
                            <div className="mt-3 bg-black/5 p-4 rounded-xl text-xs font-mono space-y-2 animate-slide-up">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Model:</span>
                                    <span className="font-bold">{recipe.aiTechnicalData.model}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Optimization Time:</span>
                                    <span className="font-bold">{recipe.aiTechnicalData.processingTimeMs}ms</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tokens Used:</span>
                                    <span className="font-bold">{recipe.aiTechnicalData.tokensUsed}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-1">Constraints Solved:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {recipe.aiTechnicalData.constraintsChecked.map((c, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px]">{c}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-gray-200/50">
                                    <span className="text-gray-500 block mb-1">Reasoning:</span>
                                    <p className="italic opacity-80">{recipe.aiTechnicalData.optimizationLogic}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};