import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ScanLine, Refrigerator, ChefHat, BarChart3 } from 'lucide-react';
import { AppView, InventoryItem } from './types';
import { Scanner } from './components/Scanner';
import { Inventory } from './components/Inventory';
import { RecipeGenerator } from './components/RecipeGenerator';
import { Dashboard } from './components/Dashboard';
import { Impact } from './components/Impact';
import { VoiceAssistant } from './components/VoiceAssistant';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipeMode, setRecipeMode] = useState<'default' | 'rescue'>('default');

  useEffect(() => {
    const saved = localStorage.getItem('fridgeSmartInventory');
    if (saved) {
      try {
        setInventory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse inventory");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fridgeSmartInventory', JSON.stringify(inventory));
  }, [inventory]);

  const handleScanComplete = (newItems: InventoryItem[]) => {
    setInventory(prev => [...prev, ...newItems]);
    setView(AppView.INVENTORY);
  };

  const handleDemoLoad = (demoItems: InventoryItem[]) => {
      setInventory(demoItems);
      setView(AppView.INVENTORY);
  };

  const handleDeleteItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const handleRescueRecipes = () => {
    setRecipeMode('rescue');
    setView(AppView.RECIPES);
  };

  const handleNavChange = (newView: AppView) => {
    if (newView !== AppView.RECIPES) {
      setRecipeMode('default');
    }
    setView(newView);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-100">
      
      <main className="min-h-screen relative bg-gray-50">
        {view === AppView.DASHBOARD && (
          <Dashboard 
            inventory={inventory} 
            onGenerateRescueRecipes={handleRescueRecipes}
            onScan={() => setView(AppView.SCANNER)}
            onDemoLoad={handleDemoLoad}
          />
        )}
        {view === AppView.SCANNER && (
          <Scanner 
            onItemsFound={handleScanComplete} 
            onCancel={() => handleNavChange(AppView.DASHBOARD)} 
          />
        )}
        {view === AppView.INVENTORY && (
          <Inventory items={inventory} onDeleteItem={handleDeleteItem} />
        )}
        {view === AppView.RECIPES && (
          <RecipeGenerator 
            inventory={inventory} 
            initialMode={recipeMode}
          />
        )}
        {view === AppView.IMPACT && (
          <Impact inventory={inventory} />
        )}
        
        {view !== AppView.SCANNER && <VoiceAssistant inventory={inventory} />}
      </main>

      {/* Premium Glassmorphism Navigation */}
      <nav className="fixed bottom-6 left-4 right-4 max-w-[calc(28rem-2rem)] mx-auto bg-white/90 backdrop-blur-xl border border-white/40 rounded-[2rem] flex justify-around items-center py-3 px-1 z-50 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        
        <NavButton view={view} target={AppView.DASHBOARD} icon={LayoutDashboard} label="Home" setView={handleNavChange} />
        <NavButton view={view} target={AppView.SCANNER} icon={ScanLine} label="Scan" setView={handleNavChange} isSpecial />
        <NavButton view={view} target={AppView.INVENTORY} icon={Refrigerator} label="Items" setView={handleNavChange} />
        <NavButton view={view} target={AppView.RECIPES} icon={ChefHat} label="Chef" setView={handleNavChange} />
        <NavButton view={view} target={AppView.IMPACT} icon={BarChart3} label="Impact" setView={handleNavChange} />

      </nav>
    </div>
  );
}

const NavButton = ({ view, target, icon: Icon, label, setView, isSpecial }: any) => {
  const isActive = view === target;
  
  if (isSpecial) {
    return (
      <button
        onClick={() => setView(target)}
        className="relative -top-8"
      >
        <div className="bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white p-4 rounded-full border-[6px] border-gray-50 shadow-xl active:scale-95 transition-transform">
          <Icon className="w-6 h-6" />
        </div>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Scan</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setView(target)}
      className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 active:scale-90 w-16 ${
        isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
      <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{label}</span>
      {isActive && <div className="w-1 h-1 bg-emerald-600 rounded-full mt-1"></div>}
    </button>
  );
}