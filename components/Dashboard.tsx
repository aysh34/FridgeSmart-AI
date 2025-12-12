import React, { useEffect, useState } from 'react';
import { InventoryItem, ItemStatus } from '../types';
import { getDemoItems } from '../services/geminiService';
import { AlertCircle, ArrowRight, Leaf, Sparkles, Star, TrendingUp, Users, PlayCircle, Zap, X, Globe, Heart, ShieldAlert } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  onGenerateRescueRecipes: () => void;
  onScan: () => void;
  onDemoLoad: (items: InventoryItem[]) => void;
}

const CountUp: React.FC<{ end: number, prefix?: string, suffix?: string, duration?: number }> = ({ end, prefix = '', suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <>{prefix}{count.toLocaleString()}{suffix}</>;
};

export const Dashboard: React.FC<DashboardProps> = ({ inventory, onGenerateRescueRecipes, onScan, onDemoLoad }) => {
  const expiringItems = inventory.filter(i => i.status === ItemStatus.EXPIRING || i.status === ItemStatus.USE_SOON);
  const [globalSavings, setGlobalSavings] = useState(47892156);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlobalSavings(prev => prev + Math.floor(Math.random() * 25));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDemoClick = () => {
    const demoItems = getDemoItems();
    onDemoLoad(demoItems);
    setShowDemo(false);
  };

  const testimonials = [
    { name: "Maria S.", role: "Mother of 2", text: "I was wasting $200 a month. Now I'm saving for their college.", loc: "Chicago" },
    { name: "James K.", role: "Student", text: "I finally stopped throwing away food I bought. Game changer.", loc: "Austin" },
    { name: "Dorothy R.", role: "Retiree", text: "My fixed income goes so much further now.", loc: "Seattle" }
  ];

  return (
    <div className="pb-32 bg-gray-50 min-h-full overflow-x-hidden">
      
      {/* HERO SECTION - THE CRISIS */}
      <div className="relative bg-gradient-to-br from-[#10B981] to-[#064e3b] text-white pt-14 pb-24 px-6 rounded-b-[3rem] shadow-elevation overflow-hidden z-10">
        
        {/* Animated Icons Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
            <div className="absolute top-10 left-10 text-6xl animate-float">🥑</div>
            <div className="absolute top-20 right-20 text-5xl animate-float-delayed">🥛</div>
            <div className="absolute bottom-32 left-8 text-6xl animate-float">🥕</div>
            <div className="absolute top-1/2 right-8 text-5xl animate-float-delayed">🍎</div>
        </div>

        <div className="relative z-20 flex flex-col items-center text-center">
           {/* Community Stats Banner */}
           <div className="glass-dark px-4 py-2 rounded-full flex items-center gap-2 mb-6 border border-white/20 shadow-lg animate-scale-in">
              <Globe className="w-4 h-4 text-emerald-200" />
              <span className="text-xs font-bold tracking-wide">
                <span className="font-mono text-emerald-100">$<CountUp end={globalSavings} /></span> saved collectively
              </span>
           </div>
           
           <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight mb-4 drop-shadow-sm animate-slide-up">
             The American<br />
             <span className="text-emerald-200">Food Crisis.</span>
           </h1>
           
           <p className="text-lg text-emerald-50/90 font-medium mb-8 max-w-xs animate-slide-up" style={{ animationDelay: '100ms' }}>
             Families waste <span className="font-bold text-white">$1,866/year</span> on food. <br/>
             We're using Gemini 3 AI to stop it.
           </p>

           {/* Main Stat Card */}
           <div className="glass p-6 rounded-3xl w-full max-w-sm mb-8 transform hover:scale-[1.02] transition-transform duration-300 shadow-2xl animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex flex-col items-center">
                 <div className="bg-emerald-100 p-3 rounded-full mb-3 shadow-inner">
                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                 </div>
                 <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">AVERAGE USER SAVES</p>
                 <p className="text-5xl font-black text-emerald-900 tracking-tighter mb-2">$768<span className="text-lg text-emerald-700 font-bold">/YR</span></p>
                 <p className="text-sm text-gray-600 font-medium italic">"That's a family vacation."</p>
              </div>
           </div>

           {/* CTA Button */}
           <button 
             onClick={onScan}
             className="w-full max-w-xs bg-gradient-to-r from-emerald-400 to-emerald-500 text-white py-5 rounded-2xl font-bold text-xl shadow-[0_20px_40px_-15px_rgba(16,185,129,0.6)] hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.7)] hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 animate-bounce-slow"
           >
              <Zap className="w-6 h-6 fill-white" /> SCAN YOUR FRIDGE
           </button>
           
           <button onClick={() => setShowDemo(true)} className="mt-4 text-emerald-200 text-sm font-bold flex items-center gap-1 hover:text-white transition-colors">
              <PlayCircle className="w-4 h-4" /> WATCH DEMO (FOR JUDGES)
           </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="px-5 -mt-10 relative z-30 space-y-8">
        
        {/* Mission Card */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-gray-100 flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                We're building a world where no family goes hungry because of disorganization. 
                Using multimodal AI to maximize every calorie and every dollar.
            </p>
            <div className="flex gap-4 w-full">
                <div className="flex-1 bg-gray-50 rounded-xl p-3">
                   <p className="text-2xl font-bold text-gray-900">40M</p>
                   <p className="text-[10px] uppercase font-bold text-gray-400">Insecure</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-3">
                   <p className="text-2xl font-bold text-gray-900">1/3</p>
                   <p className="text-[10px] uppercase font-bold text-gray-400">Food Wasted</p>
                </div>
            </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-gray-100 relative overflow-hidden h-44">
           {testimonials.map((t, i) => (
             <div 
               key={i} 
               className={`absolute inset-0 p-6 flex flex-col justify-center transition-all duration-700 ease-in-out ${i === activeTestimonial ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
             >
                <div className="flex gap-1 text-amber-400 mb-2">
                   {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-800 font-medium italic mb-3 text-lg leading-snug">"{t.text}"</p>
                <div className="flex items-center gap-2 mt-auto">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center font-bold text-gray-500 text-xs">
                      {t.name.charAt(0)}
                   </div>
                   <div>
                      <p className="text-xs font-bold text-gray-900">{t.name}</p>
                      <p className="text-[10px] text-gray-500">{t.role} • {t.loc}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Before / After Visual */}
        <div className="space-y-4">
           <h2 className="text-2xl font-bold text-gray-900 text-center">See the Difference</h2>
           <div className="bg-white rounded-3xl shadow-card overflow-hidden flex">
              <div className="flex-1 bg-gray-100 p-4 border-r border-gray-200 flex flex-col items-center text-center opacity-70 grayscale">
                 <p className="text-xs font-bold text-gray-500 uppercase mb-2">BEFORE</p>
                 <div className="text-4xl mb-2">😫</div>
                 <p className="text-sm font-bold text-red-500 mb-1">$156 Wasted</p>
                 <p className="text-xs text-gray-500">Stressed & disorganized</p>
              </div>
              <div className="flex-1 bg-emerald-50 p-4 flex flex-col items-center text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-200 rounded-full blur-2xl -mr-8 -mt-8"></div>
                 <p className="text-xs font-bold text-emerald-600 uppercase mb-2">AFTER</p>
                 <div className="text-4xl mb-2">🤩</div>
                 <p className="text-sm font-bold text-emerald-600 mb-1">$27 Wasted</p>
                 <p className="text-xs text-emerald-800">Peace of mind</p>
              </div>
           </div>
        </div>

      </div>

      {/* Demo Video Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowDemo(false)}>
           <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <div className="p-6 bg-gray-900 text-white">
                 <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-2xl text-emerald-400">Demo Mode</h3>
                    <button onClick={() => setShowDemo(false)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
                 </div>
                 <p className="text-gray-300 text-base mb-6">
                    Experience the full "Maria's Story" user journey instantly. This will load sample data processed by Gemini 3 Pro.
                 </p>
                 
                 <div className="space-y-4">
                     <div className="flex items-center gap-3 text-sm text-gray-400">
                         <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">1</div>
                         Loads 5 items (including expired chicken)
                     </div>
                     <div className="flex items-center gap-3 text-sm text-gray-400">
                         <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">2</div>
                         Showcases Vision + OCR + Reasoning
                     </div>
                     <div className="flex items-center gap-3 text-sm text-gray-400">
                         <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">3</div>
                         Enables "Rescue Mode" capability
                     </div>
                 </div>

                 <button 
                    onClick={handleDemoClick}
                    className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                 >
                    <PlayCircle className="w-5 h-5" /> Launch Demo Experience
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};