import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Sparkles, Loader2, Mic, Volume2, VolumeX, MicOff, AlertCircle } from 'lucide-react';
import { InventoryItem } from '../types';
import { chatWithAssistant } from '../services/geminiService';

interface VoiceAssistantProps {
  inventory: InventoryItem[];
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ inventory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: 'Hi! I can help you plan meals, check inventory, or find quick recipes. What do you need?' }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for stability
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inventoryRef = useRef(inventory); // Keep fresh ref of inventory
  const inputRef = useRef(input); // Keep fresh ref of input

  // Update refs when props/state change
  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  useEffect(() => { inputRef.current = input; }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, loading]);

  // Cleanup speech synthesis and recognition on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (isMuted) return;
    
    // Simple sanitization
    const cleanText = text.replace(/[*#]/g, '');
    
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    // Try to find a pleasant English voice
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) 
                        || voices.find(v => v.name.includes('Samantha')) 
                        || voices.find(v => v.lang === 'en-US');
    
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.05; // Slightly faster
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const handleSend = useCallback(async (textOverride?: string) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : inputRef.current;
    if (!textToSend.trim()) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setError(null);

    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    try {
      // Use ref for inventory to ensure we always have latest items without re-binding
      const response = await chatWithAssistant(textToSend, inventoryRef.current);
      
      setMessages(prev => [...prev, { role: 'assistant', text: response || "I'm not sure, but I'm learning!" }]);
      
      if (response && !isMuted) {
          speak(response);
      }
    } catch (error) {
       const errorMsg = "Sorry, I lost connection to the kitchen brain. Try again?";
       setMessages(prev => [...prev, { role: 'assistant', text: errorMsg }]);
       if (!isMuted) speak(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [isMuted, speak]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Stop after one sentence
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            // Small delay to let user see what they said before sending
            setTimeout(() => {
                handleSend(transcript);
            }, 500);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                setError("Mic access denied. Check settings.");
            } else if (event.error === 'no-speech') {
                setError("Didn't hear anything.");
            } else {
                setError("Voice error. Try typing.");
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }
  }, [handleSend]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
        alert("Voice recognition is not supported in this browser.");
        return;
    }

    if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
    } else {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error("Start error:", e);
            // If already started, stop first then retry
            recognitionRef.current.stop();
            setTimeout(() => {
                try { recognitionRef.current.start(); } catch(err) { setError("Could not start mic."); }
            }, 100);
        }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 bg-primary-600 text-white p-4 rounded-full shadow-elevation hover:bg-primary-700 transition-all active:scale-95 z-40 flex items-center gap-2 group"
      >
        <div className="absolute inset-0 bg-primary-400 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
        <Sparkles className="w-6 h-6 relative z-10" />
        <span className="font-bold pr-1 relative z-10">Ask AI</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 flex justify-between items-center text-white shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full transition-colors ${isSpeaking ? 'bg-white text-primary-600 animate-pulse' : 'bg-white/20 text-white'}`}>
               <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Kitchen Assistant</h3>
              <p className="text-xs text-primary-100 flex items-center gap-1">
                 {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => {
                    if (isSpeaking) {
                        window.speechSynthesis.cancel();
                        setIsSpeaking(false);
                    }
                    setIsMuted(!isMuted);
                }} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
                {isMuted ? <VolumeX className="w-5 h-5 opacity-70" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button onClick={() => {
                setIsOpen(false);
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
                if (isListening && recognitionRef.current) recognitionRef.current.stop();
            }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start animate-pulse">
               <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                 <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                 <span className="text-xs text-gray-400 font-medium">Thinking...</span>
               </div>
             </div>
          )}
          
          {error && (
            <div className="flex justify-center">
                 <div className="bg-red-50 text-red-500 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {error}
                 </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Visualizer for Listening Mode (Overlay) */}
        {isListening && (
            <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-200">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20 duration-1000"></div>
                    <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping delay-300 opacity-20 duration-1000"></div>
                    <button 
                        onClick={toggleListening}
                        className="w-24 h-24 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-2xl scale-110 transition-transform active:scale-95 relative z-10"
                    >
                        <Mic className="w-10 h-10 animate-pulse" />
                    </button>
                </div>
                <p className="mt-8 text-xl font-bold text-gray-800 animate-pulse">Listening...</p>
                <button onClick={toggleListening} className="mt-4 text-sm text-gray-500 hover:text-gray-800 font-medium">
                    Tap to cancel
                </button>
            </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 pb-safe">
          <div className="flex gap-2 items-center bg-gray-50 p-1.5 pl-4 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all shadow-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about recipes, inventory..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 outline-none text-gray-800 placeholder-gray-400"
            />
            
            {/* Mic Button */}
            {!input.trim() && (
                <button 
                    onClick={toggleListening}
                    className={`p-2.5 rounded-full transition-colors ${recognitionRef.current ? 'text-primary-600 hover:bg-primary-50' : 'text-gray-300 cursor-not-allowed'}`}
                    title={recognitionRef.current ? "Speak" : "Voice not supported"}
                    disabled={!recognitionRef.current}
                >
                    {recognitionRef.current ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
            )}

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className={`p-2.5 rounded-full transition-all shadow-sm ${
                input.trim()
                  ? 'bg-primary-600 text-white hover:bg-primary-700 transform hover:scale-105'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};