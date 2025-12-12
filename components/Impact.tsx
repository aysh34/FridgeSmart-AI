import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from 'recharts';
import { TrendingUp, Users, Droplet, Globe, Award, Share2, Check, Copy } from 'lucide-react';

interface ImpactProps {
  inventory: InventoryItem[];
}

export const Impact: React.FC<ImpactProps> = ({ inventory }) => {
  const [copied, setCopied] = useState(false);
  const data = [{name:'Mon', v:20}, {name:'Tue', v:45}, {name:'Wed', v:70}, {name:'Thu', v:90}, {name:'Fri', v:127}];
  const pieData = [{name:'Produce', v:35}, {name:'Dairy', v:20}, {name:'Meat', v:15}, {name:'Grains', v:30}];
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280'];

  const handleShare = async () => {
    // Use a static URL to ensure it's valid for sharing APIs
    const shareData = {
      title: 'My FridgeSmart Impact',
      text: 'I just saved $127 and reduced my food waste by 82% with FridgeSmart! 🌍🥑',
      url: 'https://fridgesmart.app' 
    };

    const showSuccess = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    try {
      // 1. Try Native Share
      // Check if the browser supports sharing this specific data
      if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
            // If share is successful, we don't necessarily need to show "Copied", but we can tracking it.
            return; 
        } catch (e) {
            // AbortError means the user closed the share sheet. We stop here.
            if ((e as Error).name === 'AbortError') return;
            // Other errors (like permission issues), fall through to clipboard
            console.warn("Native share failed, attempting clipboard fallback", e);
        }
      }

      // 2. Fallback to Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
             await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
             showSuccess();
             return;
          } catch (err) {
             console.warn("Clipboard API failed", err);
          }
      }

      // 3. Last Resort: TextArea Hack (for older browsers/webviews)
      const textArea = document.createElement("textarea");
      textArea.value = `${shareData.text} ${shareData.url}`;
      
      // Ensure element is part of DOM but invisible to prevent scrolling
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      try {
         const successful = document.execCommand('copy');
         if (successful) showSuccess();
         else alert("Could not share. Please take a screenshot!");
      } catch (err) {
         alert("Could not share. Please take a screenshot!");
      } finally {
         document.body.removeChild(textArea);
      }

    } catch (err) {
      console.error('Share process error:', err);
      // Fallback alert if something catastrophic happens
      alert("Sharing is not supported on this device.");
    }
  };

  return (
    <div className="pb-32 bg-gray-50 min-h-full">
       <div className="bg-emerald-600 text-white pt-12 pb-8 px-6 rounded-b-[2.5rem] shadow-elevation">
          <h1 className="text-3xl font-black mb-1">Your Impact</h1>
          <p className="opacity-90">You're a Waste Warrior! 🏆</p>
       </div>

       <div className="px-5 -mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] shadow-card">
             <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-3 text-emerald-600"><TrendingUp /></div>
             <p className="text-xs text-gray-500 font-bold uppercase">SAVED MONTHLY</p>
             <p className="text-3xl font-black text-gray-900">$127</p>
             <p className="text-xs text-emerald-600 font-bold">+23% vs last mo</p>
          </div>
          <div className="bg-white p-5 rounded-[2rem] shadow-card">
             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600"><Award /></div>
             <p className="text-xs text-gray-500 font-bold uppercase">PREVENTION RATE</p>
             <p className="text-3xl font-black text-gray-900">82%</p>
             <p className="text-xs text-gray-400">Top 15% of users</p>
          </div>
       </div>

       <div className="px-5 mt-6 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-card border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-6">Savings Trend</h3>
             <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={data}>
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 30px rgba(0,0,0,0.1)'}} />
                      <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={4} dot={{r:4, fill:'#10b981'}} />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-card border border-gray-100 flex gap-6 items-center">
             <div className="w-32 h-32 relative">
                <ResponsiveContainer>
                   <PieChart>
                      <Pie data={pieData} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="v">
                         {pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                   </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-400 text-xs">Category</div>
             </div>
             <div>
                <h3 className="font-bold text-gray-900 mb-2">Breakdown</h3>
                {pieData.map((e, i) => (
                   <div key={i} className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                      {e.name} ({e.v}%)
                   </div>
                ))}
             </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-[2rem] text-white shadow-lg">
             <h3 className="font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5" /> Environmental Impact</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                   <Droplet className="w-6 h-6 mb-2 opacity-80" />
                   <p className="text-2xl font-bold">145</p>
                   <p className="text-xs opacity-80">Gallons Water</p>
                </div>
                <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                   <Users className="w-6 h-6 mb-2 opacity-80" />
                   <p className="text-2xl font-bold">78</p>
                   <p className="text-xs opacity-80">Lbs CO2 Saved</p>
                </div>
             </div>
          </div>
          
          <button 
            onClick={handleShare}
            disabled={copied}
            className={`w-full py-4 border-2 rounded-2xl font-bold flex justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all ${copied ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-gray-200 text-gray-600'}`}
          >
             {copied ? (
                 <>
                    <Check className="w-5 h-5" /> Copied to Clipboard!
                 </>
             ) : (
                 <>
                    <Share2 className="w-5 h-5" /> Share My Impact
                 </>
             )}
          </button>
       </div>
    </div>
  );
};