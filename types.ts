export enum ItemStatus {
  FRESH = 'Fresh',
  GOOD = 'Good',
  USE_SOON = 'Use Soon',
  EXPIRING = 'Expiring',
  SPOILED = 'Spoiled'
}

export interface AiAnalysis {
  confidence: number;
  reasoning: string;
  freshnessCues: string[];
  visualIndicators: string;
  ocrText?: string;
  processingTimeMs?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  expirationDate?: string; // ISO String YYYY-MM-DD
  daysUntilExpiration: number;
  status: ItemStatus;
  estimatedValue: number; // USD
  addedDate: string; // ISO String
  aiAnalysis?: AiAnalysis; // New field for technical transparency
}

export interface Ingredient {
  name: string;
  amount: string;
  isInInventory: boolean;
  estimatedCost?: number; // Cost if missing
  urgency?: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface Substitution {
  original: string;
  alternatives: string[];
  note?: string;
}

export interface MacroNutrients {
  calories: number;
  protein: string;
  carbs: string;
  fats: string;
}

export interface DetailedNutrition {
  servings: number;
  perServing: MacroNutrients & {
    fiber?: string;
    sodium?: string;
  };
  highlights?: string[];
}

export interface RecipeInstruction {
  step: number;
  text: string;
  duration?: string; // e.g. "5 min"
  tip?: string;
  why?: string;
}

export interface CostBreakdown {
  total: number;
  perServing: number;
  breakdown: {
    have: number;
    needToBuy: number;
  };
  comparison?: string;
}

export interface AiOptimizationData {
  constraintsChecked: string[];
  tokensUsed: number;
  processingTimeMs: number;
  optimizationLogic: string;
  model: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients: Ingredient[];
  criticalItemsUsed: string[];
  substitutions: Substitution[];
  instructions: RecipeInstruction[];
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: number;
  cost: CostBreakdown;
  costPerServing: number;
  totalCost: number;
  savings: number; // Value of inventory used
  savingsMessage?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Chef';
  difficultyReason?: string;
  macros: MacroNutrients;
  nutrition: DetailedNutrition;
  tags: string[];
  storage?: string;
  tips?: string[];
  variations?: string[];
  aiTechnicalData?: AiOptimizationData; // New field for technical transparency
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCANNER = 'SCANNER',
  INVENTORY = 'INVENTORY',
  RECIPES = 'RECIPES',
  IMPACT = 'IMPACT',
}