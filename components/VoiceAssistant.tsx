import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, MessageSquare, Loader2, Volume2, ShoppingBag } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { MenuItem } from '../types';

interface VoiceAssistantProps {
  menu: MenuItem[];
  addToCart: (item: MenuItem) => void;
  onCheckout: () => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ menu, addToCart, onCheckout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  // We don't rely on 'voices' state for the speak function anymore to avoid stale/empty state on mobile
  // But we keep it to trigger re-renders if needed
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  // Initialize Gemini
  const apiKey = process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  // Load Voices trigger
  useEffect(() => {
    const loadVoices = () => {
      const vs = window.speechSynthesis.getVoices();
      if (vs.length > 0) setVoicesLoaded(true);
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      // We use Indian English as the base because it often captures regional accents and Hinglish better than strict en-US
      recognitionRef.current.lang = 'en-IN'; 

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleUserMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // FETCH VOICES DYNAMICALLY ON CLICK/TRIGGER
    // This is crucial for mobile browsers where getVoices() might return empty until interaction
    const voices = window.speechSynthesis.getVoices();
    
    // Priority: Indian English (Best for Hinglish/Roman Script) -> Hindi -> Default
    const indianEnglishVoice = voices.find(v => v.lang === 'en-IN' || v.lang.includes('en_IN'));
    const hindiVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.includes('hi'));
    const ukVoice = voices.find(v => v.lang === 'en-GB'); // Fallback

    if (indianEnglishVoice) {
        utterance.voice = indianEnglishVoice;
        utterance.rate = 0.95; 
    } else if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.rate = 1.0; 
    } else if (ukVoice) {
        utterance.voice = ukVoice;
    }
    
    // Force Language Hint
    utterance.lang = 'en-IN'; 
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const handleUserMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsProcessing(true);

    try {
      const model = 'gemini-2.5-flash';
      
      const menuContext = menu.map(m => `${m.name} (${m.category}, ₹${m.price}, ${m.isVegetarian ? 'Veg' : 'Non-Veg'})`).join(', ');
      
      // Hinglish Raju Persona
      const systemPrompt = `
        You are 'Raju', an experienced, extremely polite, and authentic waiter at 'Shourya Wada Dhaba'.
        
        **CORE INSTRUCTIONS:**
        1. **Language:** The user might speak in Hindi, Marathi, Kannada, or English. You must UNDERSTAND all of them (even if transcribed phonetically in English text), but **REPLY ONLY IN HINGLISH** (Hindi words using English letters).
        2. **Tone:** Very Polite. Use "Ji Sir", "Madam", "Sahab", "Hukum".
        3. **CRITICAL:** If the user confirms a dish or asks for a dish, you **MUST SPEAK THE FULL NAME OF THE ITEM** in your reply. e.g. "Ji Sir, 1 Butter Chicken add kar diya." DO NOT just say "Okay" or "Done".
        
        **Interaction Flow:**
        1. **Welcome:** "Namaste Sir/Madam! Shourya Wada mein swagat hai."
        2. **Preference:** Ask "Veg lenge ya Non-Veg Sir?" if unknown.
        3. **Carb Check:** Ask "Roti ya Rice?" if dish is decided.
        4. **Suggest:** Recommend 2 items based on preference.
        
        **Actions:**
        - If user confirms a dish, output tag: [ORDER: ItemName].
        - If user says "Book Order", "Checkout", "Bill", "Pay", "Bus", "Done", "Order maadi", "Enough", output tag: [ACTION: CHECKOUT].

        **Menu Context:** ${menuContext}
        
        **Rules:**
        - Keep responses short (max 20 words).
        - Use Roman Script ONLY (No Devanagari).
        - Be humble and respectful.

        **Current User Input:** ${text}
      `;

      const chatHistory = messages.map(m => `${m.role === 'user' ? 'Customer' : 'Waiter'}: ${m.text}`).join('\n');
      const prompt = `${systemPrompt}\n\nChat History:\n${chatHistory}\nCustomer: ${text}\nWaiter:`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      const aiResponse = response.text.trim();
      
      // 1. Check for Checkout Action
      if (aiResponse.includes('[ACTION: CHECKOUT]')) {
        const cleanResponse = aiResponse.replace(/\[ACTION: CHECKOUT\]/g, '').replace(/\[ORDER: .*?\]/g, '').trim();
        const finalMsg = cleanResponse || "Ji Sir, main bill lekar aata hoon. Payment counter pe chaliye.";
        
        setMessages(prev => [...prev, { role: 'ai', text: finalMsg }]);
        speakText(finalMsg);
        
        setTimeout(() => {
            setIsOpen(false);
            onCheckout();
        }, 2500);
        
        setIsProcessing(false);
        return;
      }

      // 2. Check for Order Tag
      const orderMatch = aiResponse.match(/\[ORDER: (.*?)\]/);
      let displayResponse = aiResponse.replace(/\[ORDER: .*?\]/, '').trim();

      if (orderMatch) {
        const itemName = orderMatch[1];
        // Fuzzy search for item
        const item = menu.find(m => m.name.toLowerCase().includes(itemName.toLowerCase()));
        if (item) {
          addToCart(item);
          // Force the response to be very explicit if the AI was lazy
          if (!displayResponse.toLowerCase().includes(item.name.toLowerCase())) {
             displayResponse = `Ji Sir, 1 ${item.name} add kar diya hai.`;
          }
        }
      }

      setMessages(prev => [...prev, { role: 'ai', text: displayResponse }]);
      speakText(displayResponse);

    } catch (error) {
      console.error("AI Error:", error);
      const fallback = "Maaf kijiye Sir, network issue hai. Kripya menu se order karein.";
      setMessages(prev => [...prev, { role: 'ai', text: fallback }]);
      speakText(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const startConversation = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      // Hinglish Greeting
      const intro = "Namaste Sir! Shourya Wada mein aapka swagat hai. Kya lenge aaj? Veg ya Non-Veg?";
      setMessages([{ role: 'ai', text: intro }]);
      // Small delay to allow UI to render before speaking
      setTimeout(() => speakText(intro), 500);
    }
  };

  return (
    <>
      {/* Floating Mic Button - Huge for Mobile */}
      <button 
        onClick={startConversation}
        className="fixed bottom-24 right-4 md:bottom-20 z-[60] bg-gradient-to-r from-orange-600 to-red-600 text-white p-5 rounded-full shadow-lg shadow-orange-500/50 hover:scale-110 transition-transform animate-bounce-slow border-4 border-white group active:scale-95"
        aria-label="Talk to AI Waiter"
      >
        <div className="absolute -top-10 right-0 bg-white text-gray-900 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none transform translate-y-2 group-hover:translate-y-0">
            Voice Order 🎙️
        </div>
        <Mic size={32} />
      </button>

      {/* Chat Interface Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up relative">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 flex justify-between items-center text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full border border-white/20 backdrop-blur-md">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl leading-tight">Raju (Waiter)</h3>
                  <p className="text-[10px] text-orange-100 uppercase tracking-wider font-bold opacity-90">Hindi • Marathi • Kannada • English</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsOpen(false); synthRef.current.cancel(); }} 
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-orange-50/30 min-h-[300px]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-base font-medium leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-gray-800 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}>
                    {msg.role === 'ai' && <span className="block text-[10px] font-bold text-orange-600 mb-1 uppercase tracking-wider">Raju</span>}
                    {msg.text}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start animate-fade-in">
                   <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-2.5">
                      <Loader2 size={16} className="animate-spin text-orange-600" />
                      <span className="text-xs text-gray-500 font-medium italic">Sun raha hoon Sir...</span>
                   </div>
                </div>
              )}
              <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })}></div>
            </div>

            {/* Mic Control Area - Massive Button for easier clicking */}
            <div className="p-6 bg-white border-t border-gray-100 flex flex-col items-center gap-4 relative">
               {/* Status Pill */}
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm text-[10px] font-bold text-gray-500 flex items-center gap-2">
                  {isSpeaking ? (
                      <span className="flex items-center gap-1 text-orange-600">
                          <Volume2 size={12} className="animate-pulse" /> Speaking
                      </span>
                  ) : isListening ? (
                      <span className="flex items-center gap-1 text-red-600 animate-pulse">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> Listening
                      </span>
                  ) : (
                      <span>Tap mic to reply</span>
                  )}
               </div>

               <div className="flex items-center gap-4 w-full justify-center">
                    <button 
                        onClick={toggleListening}
                        disabled={isProcessing}
                        className={`p-6 rounded-full transition-all duration-300 transform ${
                        isListening 
                        ? 'bg-red-50 text-red-600 ring-4 ring-red-100 scale-110 shadow-inner' 
                        : 'bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95'
                        }`}
                        style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {isListening ? <MicOff size={36} /> : <Mic size={36} />}
                    </button>

                    <button 
                        onClick={() => {
                            setIsOpen(false);
                            onCheckout();
                        }}
                        className="absolute right-6 p-4 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex flex-col items-center gap-1 shadow-md"
                        title="Go to Checkout"
                    >
                        <ShoppingBag size={24} />
                        <span className="text-[10px] font-bold">BILL</span>
                    </button>
               </div>
               
               <p className="text-sm font-semibold text-gray-400 text-center max-w-[200px]">
                 {isListening ? "Boliye Sir..." : "Tap & Speak"}
               </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};