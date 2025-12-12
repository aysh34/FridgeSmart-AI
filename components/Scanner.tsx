import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, CheckCircle, X, ChevronDown, Edit2, AlertCircle, RefreshCw, SwitchCamera, ScanLine, Lightbulb, ArrowRight, Sparkles, BrainCircuit, Plus, Eye, Search, FileText, PenTool } from 'lucide-react';
import { analyzeImageForInventory } from '../services/geminiService';
import { InventoryItem, ItemStatus } from '../types';
import confetti from 'canvas-confetti';

interface ScannerProps {
  onItemsFound: (items: InventoryItem[]) => void;
  onCancel: () => void;
}

const CATEGORIES = [
  'Produce', 'Dairy', 'Meat', 'Grains', 'Condiments', 'Frozen', 'Beverages', 'Snacks', 'Other'
];

export const Scanner: React.FC<ScannerProps> = ({ onItemsFound, onCancel }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<InventoryItem[] | null>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isFlashing, setIsFlashing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // New state for technical details view
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Manual Add State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemCategory, setNewItemCategory] = useState('Produce');
  const [newItemDays, setNewItemDays] = useState(7);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Handle stream attachment
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.onloadedmetadata = () => {
        video.play().catch(e => {
            console.error("Error playing video:", e);
            setCameraError("Could not start video stream. Please try uploading a photo.");
        });
      };
    }
  }, [isCameraOpen]);

  // Premium Loading State Animation
  useEffect(() => {
    if (isAnalyzing) {
       setLoadingStep(0);
       const interval = setInterval(() => {
         setLoadingStep(prev => {
            if (prev >= 3) return prev;
            return prev + 1;
         });
       }, 1500);
       return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const LOADING_STEPS = [
    { text: "Gemini 3 Vision: Scanning Objects...", icon: <Eye className="w-8 h-8 text-emerald-400" />, detail: "Identifying 200+ food types" },
    { text: "OCR Engine: Extracting Dates...", icon: <FileText className="w-8 h-8 text-blue-400" />, detail: "Reading small print & curved text" },
    { text: "Visual Reasoning: Checking Freshness...", icon: <Search className="w-8 h-8 text-purple-400" />, detail: "Detecting browning, wilting, seals" },
    { text: "Value Model: Estimating Savings...", icon: <Sparkles className="w-8 h-8 text-amber-400" />, detail: "Calculating potential waste cost" }
  ];

  const startCamera = async (modeOverride?: 'user' | 'environment') => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera API not supported in this browser. Please use the Upload Photo option.");
      return;
    }

    const modeToUse = modeOverride || facingMode;
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: modeToUse,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false 
        });
      } catch (err) {
        console.warn("Specific facing mode failed, falling back to any video camera");
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please check permissions or use Upload Photo.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      // Trigger flash animation
      setIsFlashing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL('image/jpeg', 0.8);
        
        // Wait for flash animation to complete before stopping camera and showing preview
        setTimeout(() => {
          setIsFlashing(false);
          setPreview(base64Data);
          stopCamera();
          analyze(base64Data.split(',')[1]);
        }, 300);
      }
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (typeof base64String === 'string') {
            setPreview(base64String);
            analyze(base64String.split(',')[1]); 
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const analyze = async (base64Data: string) => {
    setIsAnalyzing(true);
    try {
      const items = await analyzeImageForInventory(base64Data);
      setScannedItems(items);
      // Success Confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });
    } catch (error) {
      alert("Failed to analyze image. Please try again.");
      setPreview(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateItem = (id: string, field: keyof InventoryItem, value: any) => {
    if (!scannedItems) return;
    
    setScannedItems(scannedItems.map(item => {
        if (item.id !== id) return item;
        
        const updates: Partial<InventoryItem> = { [field]: value };
        
        // Smart update: Recalculate status and expiration date if days are changed manually
        if (field === 'daysUntilExpiration') {
            const days = parseInt(value);
            if (!isNaN(days)) {
                 const date = new Date();
                 date.setDate(date.getDate() + days);
                 updates.expirationDate = date.toISOString().split('T')[0];
                 
                 if (days <= 2) updates.status = ItemStatus.EXPIRING;
                 else if (days <= 5) updates.status = ItemStatus.USE_SOON;
                 else if (days <= 14) updates.status = ItemStatus.GOOD;
                 else updates.status = ItemStatus.FRESH;
            }
        }
        
        return { ...item, ...updates };
    }));
  };

  const addNewItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: InventoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: newItemName,
        quantity: newItemQuantity,
        category: newItemCategory,
        daysUntilExpiration: newItemDays,
        status: newItemDays <= 3 ? ItemStatus.EXPIRING : (newItemDays <= 7 ? ItemStatus.USE_SOON : ItemStatus.GOOD),
        estimatedValue: 0, // Default value for manually added items
        expirationDate: new Date(Date.now() + newItemDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        addedDate: new Date().toISOString()
    };
    
    setScannedItems(prev => prev ? [newItem, ...prev] : [newItem]);
    setIsAddModalOpen(false);
    
    // Reset form
    setNewItemName('');
    setNewItemQuantity('1');
    setNewItemCategory('Produce');
    setNewItemDays(7);
  };

  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.EXPIRING: return 'bg-red-100 text-red-800 border-red-200';
      case ItemStatus.USE_SOON: return 'bg-orange-100 text-orange-800 border-orange-200';
      case ItemStatus.GOOD: return 'bg-blue-100 text-blue-800 border-blue-200';
      case ItemStatus.FRESH: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const manualAddModal = isAddModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Add Item Manually</h3>
          <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name</label>
            <input 
              autoFocus
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              className="w-full bg-gray-50 rounded-xl border border-gray-200 p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-900"
              placeholder="e.g., Avocados"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                <select 
                  value={newItemCategory}
                  onChange={e => setNewItemCategory(e.target.value)}
                  className="w-full bg-gray-50 rounded-xl border border-gray-200 p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-900"
                >
                   {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label>
                <input 
                  value={newItemQuantity}
                  onChange={e => setNewItemQuantity(e.target.value)}
                  className="w-full bg-gray-50 rounded-xl border border-gray-200 p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-900"
                />
             </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Days Until Expiration</label>
             <div className="flex items-center gap-4 bg-gray-50 rounded-xl border border-gray-200 p-1">
                <button onClick={() => setNewItemDays(Math.max(1, newItemDays - 1))} className="p-3 hover:bg-white rounded-lg transition-colors font-bold text-gray-500">-</button>
                <input 
                  type="number" 
                  value={newItemDays}
                  onChange={e => setNewItemDays(parseInt(e.target.value) || 0)}
                  className="flex-1 text-center bg-transparent border-none font-bold text-gray-900"
                />
                <button onClick={() => setNewItemDays(newItemDays + 1)} className="p-3 hover:bg-white rounded-lg transition-colors font-bold text-gray-500">+</button>
             </div>
          </div>

          <button 
            onClick={addNewItem}
            disabled={!newItemName.trim()}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  if (scannedItems) {
    const totalValue = scannedItems.reduce((acc, item) => acc + item.estimatedValue, 0);
    const expiringCount = scannedItems.filter(i => i.status === ItemStatus.EXPIRING || i.status === ItemStatus.USE_SOON).length;

    return (
      <div className="flex flex-col h-full bg-gray-50 pb-32 relative">
        {/* Results Header */}
        <div className="px-6 py-6 border-b border-gray-100 bg-white sticky top-0 z-20 shadow-sm">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-bold text-gray-900">Scan Complete! 🎉</h2>
             <button onClick={onCancel} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg animate-scale-in">
             <p className="text-emerald-100 font-medium mb-1 uppercase text-xs tracking-wider">TOTAL VALUE FOUND</p>
             <p className="text-4xl font-bold mb-2">${totalValue.toFixed(2)}</p>
             <div className="flex items-center gap-2 text-sm font-medium bg-white/20 w-fit px-3 py-1 rounded-lg">
                <Sparkles className="w-4 h-4" /> {scannedItems.length} items identified
             </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
           {expiringCount > 0 && (
             <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-pulse-glow">
               <div className="flex items-center gap-3">
                 <div className="bg-red-100 p-2 rounded-full"><AlertCircle className="w-5 h-5 text-red-600" /></div>
                 <div>
                   <p className="text-sm font-bold text-red-900">{expiringCount} items need attention</p>
                   <p className="text-xs text-red-700">Expires within 3 days</p>
                 </div>
               </div>
             </div>
           )}

           <div className="grid gap-3">
             {scannedItems.map((item, index) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl shadow-card border border-gray-50 animate-slide-up flex flex-col overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-4 flex flex-col gap-3">
                    {/* Item Name & Status */}
                    <div className="flex justify-between items-start gap-3">
                        <div className="relative flex-1 group">
                             <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                className="text-lg font-bold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-emerald-500 p-0 focus:ring-0 w-full transition-colors rounded-none placeholder-gray-300"
                                placeholder="Item Name"
                            />
                            <Edit2 className="w-3 h-3 text-gray-300 absolute right-0 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                        
                        <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                                {item.status.toUpperCase()}
                            </span>
                            {/* Confidence Badge */}
                            {item.aiAnalysis && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${item.aiAnalysis.confidence > 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                <BrainCircuit className="w-3 h-3" /> {item.aiAnalysis.confidence}%
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Editable Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-1">
                        <div className="col-span-2">
                            <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Category</label>
                            <div className="relative">
                                <select
                                    value={item.category}
                                    onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                                    className="w-full bg-gray-50 hover:bg-white focus:bg-white rounded-lg border border-gray-100 hover:border-gray-300 focus:border-emerald-500 py-2 px-3 text-sm font-medium transition-all outline-none appearance-none"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Qty</label>
                            <input 
                                value={item.quantity} 
                                onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                                className="w-full bg-gray-50 hover:bg-white focus:bg-white rounded-lg border border-gray-100 hover:border-gray-300 focus:border-emerald-500 py-2 px-3 text-sm font-medium transition-all outline-none" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Days Left</label>
                            <input 
                                type="number"
                                value={item.daysUntilExpiration} 
                                onChange={(e) => handleUpdateItem(item.id, 'daysUntilExpiration', e.target.value)}
                                className="w-full bg-gray-50 hover:bg-white focus:bg-white rounded-lg border border-gray-100 hover:border-gray-300 focus:border-emerald-500 py-2 px-3 text-sm font-medium transition-all outline-none" 
                            />
                        </div>
                    </div>
                    
                    {/* Visual Cues - Always Visible */}
                    {item.aiAnalysis && item.aiAnalysis.freshnessCues && item.aiAnalysis.freshnessCues.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {item.aiAnalysis.freshnessCues.slice(0, 3).map((cue, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 flex items-center gap-1">
                                <Eye className="w-2.5 h-2.5" /> {cue}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* AI Transparency Section - Expandable Details */}
                {item.aiAnalysis && (
                    <div className="bg-gray-50 border-t border-gray-100 p-3">
                        <button 
                            onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                            className="flex items-center justify-between w-full text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                        >
                            <span className="flex items-center gap-1"><BrainCircuit className="w-3 h-3" /> View Gemini 3 Reasoning</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${expandedItemId === item.id ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {expandedItemId === item.id && (
                            <div className="mt-3 space-y-2 text-xs text-gray-600 animate-slide-up">
                                <div className="p-2 bg-white rounded border border-gray-100">
                                    <span className="font-bold block mb-0.5 text-gray-800">Freshness Reasoning:</span>
                                    {item.aiAnalysis.reasoning}
                                </div>
                                {item.aiAnalysis.ocrText && (
                                    <div className="p-2 bg-white rounded border border-gray-100 flex gap-2 items-start">
                                        <FileText className="w-3 h-3 mt-0.5 text-blue-500" />
                                        <div>
                                            <span className="font-bold block mb-0.5 text-gray-800">OCR Detected:</span>
                                            "{item.aiAnalysis.ocrText}"
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2 mt-1">
                                    {item.aiAnalysis.freshnessCues.map((cue, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                                            {cue}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
              </div>
             ))}
           </div>

          <button 
            onClick={() => onItemsFound(scannedItems)}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl shadow-xl hover:bg-black active:scale-[0.98] transition-all font-bold text-lg flex items-center justify-center gap-2 mt-4 sticky bottom-4 z-20"
          >
            Generate Recipes <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Action Button for Manual Add in Results View */}
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-32 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition-all z-30"
          aria-label="Add Item Manually"
        >
          <Plus className="w-8 h-8" />
        </button>

        {/* Add Item Modal */}
        {manualAddModal}
      </div>
    );
  }

  // Camera UI with AR overlay
  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Flash Animation Layer */}
        <div className={`absolute inset-0 bg-white z-[60] pointer-events-none transition-opacity ease-out ${isFlashing ? 'opacity-100 duration-0' : 'opacity-0 duration-700'}`} />
        
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="flex-1 w-full h-full object-cover" 
        />
        
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute top-8 right-6 z-20">
           <button onClick={() => {stopCamera(); onCancel();}} className="bg-black/40 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/60 transition-colors">
             <X className="w-6 h-6" />
           </button>
        </div>

        {/* AR Guide */}
        <div className="absolute top-24 left-0 right-0 z-20 flex justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-semibold shadow-xl border border-white/10 animate-slide-up flex items-center gap-2">
               <span>📸</span>
               <span>Align items within frame</span>
            </div>
        </div>

        {/* Viewfinder */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
           <div className="w-80 h-80 border border-white/30 rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-[6px] border-l-[6px] border-emerald-400 rounded-tl-3xl shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
              <div className="absolute top-0 right-0 w-12 h-12 border-t-[6px] border-r-[6px] border-emerald-400 rounded-tr-3xl shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[6px] border-l-[6px] border-emerald-400 rounded-bl-3xl shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[6px] border-r-[6px] border-emerald-400 rounded-br-3xl shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400/50 shadow-[0_0_20px_rgba(52,211,153,0.8)] animate-scan"></div>
           </div>
        </div>

        <div className="absolute bottom-0 w-full p-10 pb-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-center items-center gap-12">
           <button onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')} className="p-4 bg-white/10 rounded-full text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all">
              <SwitchCamera className="w-6 h-6" />
           </button>
           
           <button 
             onClick={capturePhoto} 
             className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
           >
              <div className="w-16 h-16 bg-white rounded-full group-active:bg-emerald-500 transition-colors"></div>
           </button>
           
           <button onClick={handleUploadClick} className="p-4 bg-white/10 rounded-full text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all">
              <Upload className="w-6 h-6" />
           </button>
           
        </div>
        
        {/* Render hidden input inside camera view for safety */}
        <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden"
            style={{ display: 'none' }} 
        />
      </div>
    );
  }

  // Processing State - Updated for Technical Depth
  if (isAnalyzing) {
    const currentStep = LOADING_STEPS[loadingStep];
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-900 text-white p-6 text-center">
         <div className="relative w-32 h-32 mb-10">
            <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full transition-all duration-300 animate-spin"
                 style={{ 
                    borderTopColor: loadingStep === 0 ? '#34d399' : loadingStep === 1 ? '#60a5fa' : loadingStep === 2 ? '#c084fc' : '#fbbf24'
                 }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
               {currentStep.icon}
            </div>
         </div>
         
         <div className="space-y-4 max-w-xs mx-auto">
             <h2 className="text-2xl font-bold animate-pulse transition-all duration-300">
                {currentStep.text}
             </h2>
             <p className="text-gray-400 text-sm font-mono bg-gray-800 p-2 rounded-lg border border-gray-700">
                {currentStep.detail}
             </p>
         </div>

         <div className="mt-12 w-full max-w-xs space-y-2">
             {LOADING_STEPS.map((step, idx) => (
                 <div key={idx} className={`flex items-center gap-3 text-sm ${idx <= loadingStep ? 'text-white' : 'text-gray-600'}`}>
                     <div className={`w-2 h-2 rounded-full ${idx < loadingStep ? 'bg-emerald-500' : idx === loadingStep ? 'bg-white animate-pulse' : 'bg-gray-700'}`}></div>
                     <span className={idx === loadingStep ? 'font-bold' : ''}>{step.text.split(':')[0]}</span>
                 </div>
             ))}
         </div>
         
         <div className="mt-8 text-xs text-gray-500 font-mono">
             POWERED BY GEMINI 3 PRO
         </div>
      </div>
    );
  }

  // Start Screen
  return (
    <div className="flex flex-col items-center justify-center min-h-screen pb-32 p-6 text-center animate-slide-up">
      <div className="mb-8 p-8 bg-emerald-50 rounded-[2.5rem] shadow-elevation animate-float border border-emerald-100 relative">
         <div className="absolute inset-0 bg-white/50 rounded-[2.5rem] blur-xl -z-10"></div>
         <Camera className="w-20 h-20 text-emerald-600 drop-shadow-sm" />
         <div className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-full shadow-md animate-bounce-slow">
            <Sparkles className="w-5 h-5 text-yellow-900" />
         </div>
      </div>
      <h2 className="text-4xl font-extrabold mb-3 text-gray-900 tracking-tight">Scan Your Fridge</h2>
      <p className="text-gray-500 mb-8 max-w-xs text-lg font-medium leading-relaxed">
        Point your camera at shelves or receipts. Our AI will identify everything instantly.
      </p>

      {/* Camera Error Message */}
      {cameraError && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center gap-2 max-w-sm animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {cameraError}
          </div>
      )}
      
      {/* Primary Action: Open Camera */}
      <button 
        onClick={() => startCamera()} 
        className="w-full max-w-sm py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-3xl font-bold text-xl shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
      >
         <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
         <Camera className="w-6 h-6 relative z-10" /> 
         <span className="relative z-10">Open Camera</span>
      </button>
      
      {/* Secondary Action: Upload Photo */}
      <button 
        onClick={handleUploadClick} 
        className="w-full max-w-sm mt-4 py-4 bg-white border-2 border-emerald-100 text-emerald-700 rounded-3xl font-bold text-lg shadow-sm hover:bg-emerald-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
      >
         <Upload className="w-5 h-5" />
         Upload from Gallery
      </button>

      {/* Tertiary Action: Manual Add */}
      <button 
        onClick={() => setIsAddModalOpen(true)} 
        className="w-full max-w-sm mt-4 py-3 text-gray-400 font-bold text-sm hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
      >
         <PenTool className="w-4 h-4" />
         Enter Manually
      </button>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden"
        style={{ display: 'none' }} 
      />

      {/* Add Item Modal */}
      {manualAddModal}
    </div>
  );
};