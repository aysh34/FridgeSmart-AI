import React, { useState } from 'react';
import { InventoryItem, ItemStatus } from '../types';
import { Trash2, AlertTriangle, CheckCircle, Clock, Package, Calendar } from 'lucide-react';

interface InventoryProps {
  items: InventoryItem[];
  onDeleteItem: (id: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ items, onDeleteItem }) => {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Produce', 'Dairy', 'Meat', 'Grains', 'Condiments', 'Frozen'];

  const getCategoryIcon = (c: string) => {
    const cat = c.toLowerCase();
    if (cat.includes('produce') || cat.includes('fruit') || cat.includes('veg')) return '🥑';
    if (cat.includes('dairy') || cat.includes('milk') || cat.includes('cheese')) return '🥛';
    if (cat.includes('meat') || cat.includes('chicken') || cat.includes('beef')) return '🥩';
    if (cat.includes('grain') || cat.includes('bread') || cat.includes('pasta')) return '🍞';
    if (cat.includes('condiment') || cat.includes('sauce')) return '🥫';
    if (cat.includes('frozen') || cat.includes('ice')) return '❄️';
    if (cat.includes('beverage') || cat.includes('drink')) return '🥤';
    if (cat.includes('snack')) return '🍫';
    return '📦';
  };

  const getRelativeTime = (days: number) => {
    if (days < 0) return { text: `Expired ${Math.abs(days)}d ago`, color: 'text-gray-400', bg: 'bg-gray-100' };
    if (days === 0) return { text: 'Expires Today', color: 'text-red-600 font-bold', bg: 'bg-red-50' };
    if (days === 1) return { text: 'Expires Tomorrow', color: 'text-orange-600 font-bold', bg: 'bg-orange-50' };
    if (days <= 3) return { text: `${days} days left`, color: 'text-orange-500 font-bold', bg: 'bg-orange-50/50' };
    if (days <= 7) return { text: `${days} days left`, color: 'text-yellow-600 font-medium', bg: 'bg-yellow-50/50' };
    return { text: `${days} days`, color: 'text-emerald-600 font-medium', bg: 'bg-emerald-50/50' };
  };

  const filteredItems = filter === 'All' ? items : items.filter(i => i.category === filter);
  const totalValue = items.reduce((a,b)=>a+b.estimatedValue,0);

  return (
    <div className="pb-32 pt-6 min-h-full bg-gray-50">
      <div className="px-6 mb-6">
        <div className="flex justify-between items-end mb-2">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Kitchen</h2>
            <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">TOTAL VALUE</p>
                <p className="text-xl font-bold text-emerald-600">${totalValue.toFixed(0)}</p>
            </div>
        </div>
        <p className="text-gray-500 font-medium">{items.length} items tracked</p>
      </div>

      <div className="flex px-6 gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2 no-scrollbar">
         {filters.map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  filter === f 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' 
                  : 'bg-white text-gray-500 border border-gray-100 shadow-sm hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
         ))}
      </div>

      <div className="px-4 space-y-3 pb-20">
        {filteredItems.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-60">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-900 font-bold text-lg">No items found</p>
              <p className="text-gray-500 text-sm">Scan your fridge to get started</p>
           </div>
        ) : filteredItems.map((item, idx) => {
            const timeInfo = getRelativeTime(item.daysUntilExpiration);
            return (
                <div 
                    key={item.id} 
                    className="bg-white p-4 rounded-[1.25rem] shadow-card border border-gray-50 flex items-center justify-between group active:scale-[0.98] transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                        {getCategoryIcon(item.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base truncate">{item.name}</h3>
                        {item.daysUntilExpiration <= 2 && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 fill-red-100" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                            {item.quantity}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-md flex items-center gap-1 ${timeInfo.bg} ${timeInfo.color}`}>
                           <Clock className="w-3 h-3" /> {timeInfo.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pl-4 border-l border-gray-50 ml-2">
                     <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          if(confirm("Remove this item?")) onDeleteItem(item.id);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};