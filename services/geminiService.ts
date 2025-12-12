import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem, ItemStatus, Recipe } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const mapFreshnessToStatus = (freshness: string, days: number): ItemStatus => {
  const normalized = freshness?.toLowerCase() || '';
  if (normalized.includes('critical')) return ItemStatus.EXPIRING;
  if (normalized.includes('use soon')) return ItemStatus.USE_SOON;
  if (normalized.includes('good')) return ItemStatus.GOOD;
  if (normalized.includes('fresh')) return ItemStatus.FRESH;
  
  // Fallback to days based calculation
  if (days <= 2) return ItemStatus.EXPIRING;
  if (days <= 5) return ItemStatus.USE_SOON;
  if (days <= 14) return ItemStatus.GOOD;
  return ItemStatus.FRESH;
};

export const analyzeImageForInventory = async (base64Image: string): Promise<InventoryItem[]> => {
  const startTime = Date.now();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Keep Vision on Pro for best accuracy
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `You are the FridgeSmart Pro Vision Engine (Gemini 3 Pro).

Analyze this image with EXTREME technical precision to prevent food waste.

1. **IDENTIFICATION**: Detect every food item.
2. **OCR ANALYSIS**: Read every visible text (brands, weights, expiration dates).
3. **VISUAL FRESHNESS INSPECTOR**: Analyze specific visual cues (browning on fruit, wilting on veg, packaging bloat).
4. **VALUE ESTIMATION**: Estimate current US retail price.

For each item, return a JSON object.

CRITICAL: You must provide a "reasoning" string for your freshness assessment based on visual evidence.
Example: "Detected 15% browning on strawberry edges; recommending immediate use."
Example: "Milk carton is sealed (cap intact); typically good 7 days past sell-by if unopened."

Return JSON structure:
{
  "name": string,
  "brand": string,
  "quantity": string,
  "category": string,
  "expirationDate": string (YYYY-MM-DD),
  "daysUntilExpiry": number,
  "freshness": "Fresh" | "Good" | "Use Soon" | "Critical",
  "freshnessReason": string,
  "visualCues": string[],
  "estimatedValue": number,
  "confidence": number (0-100),
  "ocrTextDetected": string
}`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              brand: { type: Type.STRING },
              quantity: { type: Type.STRING },
              category: { type: Type.STRING },
              expirationDate: { type: Type.STRING },
              daysUntilExpiry: { type: Type.INTEGER },
              freshness: { type: Type.STRING },
              freshnessReason: { type: Type.STRING },
              visualCues: { type: Type.ARRAY, items: { type: Type.STRING } },
              estimatedValue: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
              ocrTextDetected: { type: Type.STRING }
            },
            required: ["name", "daysUntilExpiry", "estimatedValue", "freshnessReason", "confidence"]
          }
        }
      }
    });

    const rawItems = JSON.parse(response.text || "[]");
    const endTime = Date.now();

    return rawItems.map((item: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: item.brand ? `${item.brand} ${item.name}` : item.name,
      quantity: item.quantity,
      category: item.category,
      daysUntilExpiration: item.daysUntilExpiry,
      status: mapFreshnessToStatus(item.freshness, item.daysUntilExpiry),
      estimatedValue: item.estimatedValue,
      expirationDate: item.expirationDate || new Date(Date.now() + item.daysUntilExpiry * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      addedDate: new Date().toISOString(),
      aiAnalysis: {
        confidence: item.confidence,
        reasoning: item.freshnessReason,
        freshnessCues: item.visualCues || [],
        visualIndicators: item.freshness,
        ocrText: item.ocrTextDetected,
        processingTimeMs: (endTime - startTime) / rawItems.length
      }
    }));

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image.");
  }
};

const mapToRecipe = (r: any, technicalData?: any): Recipe => ({
  id: Math.random().toString(36).substr(2, 9),
  title: r.name || "Untitled Recipe",
  description: r.description || "No description available",
  type: r.type,
  ingredients: (r.ingredients || []).map((i: any) => ({
    name: i.item || "Unknown Ingredient",
    amount: i.amount || "",
    isInInventory: !!i.have,
    estimatedCost: i.estimatedCost || 0,
    urgency: i.urgency
  })),
  criticalItemsUsed: r.criticalItemsUsed || [],
  substitutions: r.substitutions || [],
  instructions: (r.instructions || []).map((i: any) => ({
    step: i.step || 0,
    text: i.action || i.text || "Prepare ingredient",
    duration: i.time,
    tip: i.tip,
    why: i.why
  })),
  prepTime: (r.timing?.prep || 0) + "m",
  cookTime: (r.timing?.cook || 0) + "m",
  totalTime: (r.timing?.total || 0) + "m",
  servings: r.nutrition?.servings || 4,
  costPerServing: r.cost?.perServing || 0,
  totalCost: r.cost?.total || 0,
  cost: r.cost || { total: 0, perServing: 0, breakdown: { have: 0, needToBuy: 0 } },
  savings: r.cost?.breakdown?.have || 0,
  savingsMessage: r.savingsMessage,
  difficulty: r.difficulty || 'Medium',
  difficultyReason: r.difficultyReason,
  macros: {
    calories: r.nutrition?.perServing?.calories || 0,
    protein: r.nutrition?.perServing?.protein || "0g",
    carbs: r.nutrition?.perServing?.carbs || "0g",
    fats: r.nutrition?.perServing?.fat || "0g"
  },
  nutrition: r.nutrition || {},
  tags: r.tags || [],
  storage: r.storage,
  tips: r.tips || [],
  variations: r.variations || [],
  aiTechnicalData: technicalData
});

const RECIPE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      type: { type: Type.STRING },
      savingsMessage: { type: Type.STRING },
      criticalItemsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            item: { type: Type.STRING },
            amount: { type: Type.STRING },
            have: { type: Type.BOOLEAN },
            estimatedCost: { type: Type.NUMBER },
            urgency: { type: Type.STRING }
          }
        }
      },
      substitutions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
            note: { type: Type.STRING }
          }
        }
      },
      instructions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.INTEGER },
            action: { type: Type.STRING },
            time: { type: Type.STRING },
            tip: { type: Type.STRING },
            why: { type: Type.STRING }
          }
        }
      },
      timing: {
        type: Type.OBJECT,
        properties: {
          prep: { type: Type.NUMBER },
          cook: { type: Type.NUMBER },
          total: { type: Type.NUMBER }
        }
      },
      difficulty: { type: Type.STRING },
      difficultyReason: { type: Type.STRING },
      nutrition: {
        type: Type.OBJECT,
        properties: {
          servings: { type: Type.NUMBER },
          perServing: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein: { type: Type.STRING },
              carbs: { type: Type.STRING },
              fat: { type: Type.STRING },
              fiber: { type: Type.STRING },
              sodium: { type: Type.STRING }
            }
          },
          highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      cost: {
        type: Type.OBJECT,
        properties: {
          total: { type: Type.NUMBER },
          perServing: { type: Type.NUMBER },
          breakdown: {
            type: Type.OBJECT,
            properties: {
              have: { type: Type.NUMBER },
              needToBuy: { type: Type.NUMBER }
            }
          },
          comparison: { type: Type.STRING }
        }
      },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      storage: { type: Type.STRING },
      tips: { type: Type.ARRAY, items: { type: Type.STRING } },
      variations: { type: Type.ARRAY, items: { type: Type.STRING } },
      aiOptimizationLogic: { type: Type.STRING, description: "Detailed explanation of how you solved the constraints (expiry, budget, nutrition)." }
    },
    required: ["name", "ingredients", "instructions", "timing", "nutrition", "aiOptimizationLogic"]
  }
};

export const generateRecipesFromInventory = async (inventory: InventoryItem[]): Promise<Recipe[]> => {
  const startTime = Date.now();
  try {
    const inventoryList = inventory.map(i => `${i.quantity} ${i.name} (Expires in ${i.daysUntilExpiration} days)`).join(", ");
    const criticalItems = inventory.filter(i => i.daysUntilExpiration <= 3).map(i => i.name).join(", ");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `You are the FridgeSmart Pro Recipe Optimization Engine.
      
      GENERATE EXACTLY 3 DISTINCT RECIPES.

      Perform Multi-Constraint Optimization:
      1. **URGENCY (CRITICAL)**: Prioritize expiring items: ${criticalItems}.
      2. **BUDGET**: Minimize new purchases (<$4/serving). Use what is in inventory.
      3. **NUTRITION**: Ensure balanced macros (Protein, Carbs, Fats).
      4. **TIME**: <45 mins total preparation and cook time.
      5. **SKILL**: Provide a mix of Beginner, Intermediate, and Advanced options.
      6. **VARIETY**: Do not use the same main protein for all 3 recipes if possible.

      For each recipe, you MUST provide a "aiOptimizationLogic" string that explains your reasoning.
      Format: "I chose [Item] because it expires tomorrow (critical). Paired with [Item] for nutrition. Quick sauté method for 30-minute constraint."
      
      Inventory Available: ${inventoryList}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA as any
      }
    });

    const text = response.text || "[]";
    const rawRecipes = JSON.parse(text);
    const endTime = Date.now();
    
    return rawRecipes.map((r: any) => mapToRecipe(r, {
      constraintsChecked: ["Expiry Priority", "Budget Optimization", "Nutritional Balance", "Time Management", "Skill Variety"],
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      processingTimeMs: endTime - startTime,
      optimizationLogic: r.aiOptimizationLogic || "Optimized based on inventory constraints.",
      model: "gemini-2.5-flash"
    }));

  } catch (error) {
    console.error("Error generating recipes:", error);
    // Return empty array instead of throwing to prevent app crash, let UI handle empty state
    return [];
  }
};

export const generateRescueRecipes = async (inventory: InventoryItem[]): Promise<Recipe[]> => {
  const startTime = Date.now();
  try {
    const criticalItemsList = inventory
      .filter(i => i.daysUntilExpiration <= 3)
      .map(i => `${i.quantity} ${i.name} (Expires: ${i.daysUntilExpiration} days)`)
      .join(", ");
    
    const otherInventory = inventory
      .filter(i => i.daysUntilExpiration > 3)
      .map(i => `${i.quantity} ${i.name}`)
      .join(", ");

    // If no critical items, fall back to standard generation but force 3 recipes
    if (!criticalItemsList && inventory.length > 0) {
       return generateRecipesFromInventory(inventory);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `🚨 EMERGENCY RESCUE PROTOCOL ACTIVATED 🚨

      GENERATE EXACTLY 3 RESCUE RECIPES options:
      1. **The "Speed Rescue"**: Fastest possible meal using expiring items (<20 mins).
      2. **The "Volume Rescue"**: Uses the LARGEST quantity of expiring items.
      3. **The "Creative Rescue"**: A unique twist to make expiring ingredients exciting again.

      CRITICAL ASSETS (Must Use): ${criticalItemsList}
      SUPPORT ASSETS: ${otherInventory}
      
      OBJECTIVE:
      Prevent waste IMMEDIATELY.

      Explain your optimization reasoning in "aiOptimizationLogic" for each recipe.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA as any
      }
    });

    const text = response.text || "[]";
    const rawRecipes = JSON.parse(text);
    const endTime = Date.now();

    return rawRecipes.map((r: any) => mapToRecipe(r, {
      constraintsChecked: ["CRITICAL WASTE PREVENTION", "Speed Strategy", "Volume Strategy", "Creative Strategy"],
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      processingTimeMs: endTime - startTime,
      optimizationLogic: r.aiOptimizationLogic || "Emergency protocol executed. Optimized for immediate consumption of high-risk assets.",
      model: "gemini-2.5-flash"
    }));

  } catch (error) {
    console.error("Error generating rescue recipes:", error);
    return [];
  }
};

export const chatWithAssistant = async (message: string, inventory: InventoryItem[]) => {
   try {
    const inventoryContext = inventory.map(i => `${i.quantity} ${i.name}`).join(", ");
    const userState = inventory.filter(i => i.daysUntilExpiration <= 2).length > 2 ? "Urgent/Stressed" : "Relaxed";
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Switched to Flash for faster chat
      contents: `System: You are FridgeSmart Pro's "Conversational Kitchen AI".
      
      Your Personality:
      - Empathetic and non-judgmental (relieve guilt about waste).
      - Proactive and practical.
      - Uses emojis naturally.
      - Speaks like a supportive friend, not a robot.
      
      Context:
      - User Inventory: ${inventoryContext}
      - User State: ${userState} (Adapt your tone)
      - Current Time: ${new Date().toLocaleTimeString()}
      
      User Query: "${message}"
      
      Goal: Help them use their food, feel good about cooking, and save money. If suggesting recipes, check if they have ingredients.`
    });
    return response.text;
   } catch (error) {
     return "I'm having trouble connecting to the kitchen server right now. But I'm still here to help!";
   }
}

// SIMULATED DATA FOR DEMO MODE
export const getDemoItems = (): InventoryItem[] => {
  const baseDate = new Date();
  return [
    {
      id: "demo-1",
      name: "Organic Spinach",
      quantity: "1 bag",
      category: "Produce",
      expirationDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysUntilExpiration: 1,
      status: ItemStatus.EXPIRING,
      estimatedValue: 4.99,
      addedDate: baseDate.toISOString(),
      aiAnalysis: {
        confidence: 98,
        reasoning: "Visual wilting detected. Best by date matches visual assessment.",
        freshnessCues: ["Slight wilting", "Condensation in bag"],
        visualIndicators: "Use Soon",
        ocrText: "Organic Spinach - Best By 12/16",
        processingTimeMs: 450
      }
    },
    {
      id: "demo-2",
      name: "Greek Yogurt",
      quantity: "1/2 container",
      category: "Dairy",
      expirationDate: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysUntilExpiration: 2,
      status: ItemStatus.EXPIRING,
      estimatedValue: 3.50,
      addedDate: baseDate.toISOString(),
      aiAnalysis: {
        confidence: 92,
        reasoning: "Container opened. OCR detects sell-by date 5 days ago. Safe consumption window narrowing.",
        freshnessCues: ["Seal broken", "Rim clean"],
        visualIndicators: "Good",
        ocrText: "Fage Total 2%",
        processingTimeMs: 450
      }
    },
    {
      id: "demo-3",
      name: "Chicken Breast",
      quantity: "1 lb",
      category: "Meat",
      expirationDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysUntilExpiration: 1,
      status: ItemStatus.EXPIRING,
      estimatedValue: 8.99,
      addedDate: baseDate.toISOString(),
      aiAnalysis: {
        confidence: 99,
        reasoning: "High priority item. Color is normal pink, no graying. Use immediately.",
        freshnessCues: ["Normal color", "Package sealed"],
        visualIndicators: "Fresh",
        ocrText: "Use or Freeze By 12/16",
        processingTimeMs: 450
      }
    },
    {
      id: "demo-4",
      name: "Avocados",
      quantity: "3 count",
      category: "Produce",
      expirationDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysUntilExpiration: 3,
      status: ItemStatus.USE_SOON,
      estimatedValue: 5.00,
      addedDate: baseDate.toISOString(),
      aiAnalysis: {
        confidence: 88,
        reasoning: "Darkening skin indicates ripeness. One shows slight bruising.",
        freshnessCues: ["Dark skin", "Soft texture"],
        visualIndicators: "Ripe",
        ocrText: "Mexico #4046",
        processingTimeMs: 450
      }
    },
    {
      id: "demo-5",
      name: "Almond Milk",
      quantity: "1 carton",
      category: "Dairy",
      expirationDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysUntilExpiration: 14,
      status: ItemStatus.GOOD,
      estimatedValue: 4.29,
      addedDate: baseDate.toISOString(),
      aiAnalysis: {
        confidence: 96,
        reasoning: "Sealed container, distant expiration date.",
        freshnessCues: ["Sealed"],
        visualIndicators: "Fresh",
        ocrText: "Exp 12/30/24",
        processingTimeMs: 450
      }
    }
  ];
}