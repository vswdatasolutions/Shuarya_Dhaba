import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, MessageSquare, Loader2, Volume2, ShoppingBag, Calendar } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { MenuItem } from '../types';

interface VoiceAssistantProps {
  menu: MenuItem[];
  addToCart: (item: MenuItem) => void;
  onCheckout: () => void;
  onBooking: () => void;
}

interface AIResponse {
  response: string;
  action: 'ADD_TO_CART' | 'CHECKOUT' | 'NAVIGATE_BOOKING' | 'NONE';
  item?: string;
  quantity?: number;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ menu, addToCart, onCheckout, onBooking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  // Initialize Gemini
  const apiKey = process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  // Load Voices trigger
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
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
      
      const menuContext = menu.map(m => `${m.id}: ${m.name} (₹${m.price}, ${m.isVegetarian ? 'Veg' : 'Non-Veg'})`).join(', ');
      
      // Multilingual Raju Persona with Booking Logic & Improved Confirmations
      const systemPrompt = `
        You are 'Raju', an experienced, extremely polite, and authentic waiter at 'Shourya Wada Dhaba'.
        
        **CORE INSTRUCTIONS:**
        1. **Multilingual Understanding:** The user might speak in Hindi, Marathi, Kannada, or English. Understand the intent even if transcribed phonetically in English.
        2. **Response Style:** **ALWAYS REPLY IN HINGLISH** (Hindi words using Roman/English alphabet). This is critical for the voice engine.
           - Good: "Ji Sir, kitne log aayenge?"
           - Bad: "जी सर, कितने लोग आएंगे" (No Devanagari).
        3. **Tone:** Warm, respectful, Dhaba-style hospitality ("Ji Sir", "Hukum", "Madam").
        4. **Confirmations:** When taking an action (like adding to cart), ALWAYS explicitly mention the item name and quantity in your response text so the user knows it worked.

        **OUTPUT FORMAT:**
        You must return a **STRICT JSON OBJECT** only. Do not add markdown or extra text.
        Structure:
        {
          "response": "Your spoken response in Hinglish",
          "action": "ADD_TO_CART" | "CHECKOUT" | "NAVIGATE_BOOKING" | "NONE",
          "item": "Item Name" (only if action is ADD_TO_CART),
          "quantity": 1 (default 1 if not specified)
        }

        **LOGIC & INTENTS:**
        
        1. **BOOKING / RESERVATION:**
           - Keywords: "Book order", "Table lagao", "Reservation", "Seat chahiye", "Family aa rahi hai", "Table book".
           - **Behavior:**
             - If user hasn't specified number of people or time, **ASK FIRST**. 
               Response: "Ji Sir, zaroor. Kitne log hain aur kab aana chahenge?" (Action: NONE).
             - If user provides details (e.g. "4 log", "8 baje"), confirm and navigate.
               Response: "Ji Sir, table book karne ke liye main aapko booking page par le ja raha hoon." (Action: NAVIGATE_BOOKING).
             - If user insists on booking page directly:
               Response: "Ji Sir, booking page khol raha hoon." (Action: NAVIGATE_BOOKING).

        2. **ORDER FOOD (ADD TO CART):**
           - If user wants a dish, check quantity. If ambiguous, assume 1 but confirm in speech.
           - **CRITICAL:** In your "response" text, explicitly confirm the item and quantity added.
             - Example: "Ji Sir, 1 Butter Chicken cart mein add kar diya hai. Aur kuch lenge?"
           - Action: ADD_TO_CART.
        
        3. **CHECKOUT / BILL:**
           - Keywords: "Bill lao", "Order confirm", "Check out", "Pack kar do", "Order maadi" (Kannada), "Bill dya" (Marathi).
           - Response: "Ji Sir, main aapka bill ready kar raha hoon. Checkout page par chalte hain."
           - Action: CHECKOUT.

        4. **GENERAL CHAT:**
           - If user asks recommendations, suggest items based on the menu.
           - Always end with a polite question like "Kya main kuch aur laaun?" or "Order place karoon?"
           - Action: NONE.

        **Menu Context:** ${menuContext}
        
        **Current User Input:** "${text}"
      `;

      const chatHistory = messages.map(m => `${m.role === 'user' ? 'Customer' : 'Waiter'}: ${m.text}`).join('\n');
      const prompt = `${systemPrompt}\n\nChat History:\n${chatHistory}\nCustomer: ${text}\n`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const jsonText = response.text.trim();
      let parsedData: AIResponse;
      
      try {
        parsedData = JSON.parse(jsonText);
      } catch (e) {
        console.error("JSON Parse Error", e);
        // Fallback if AI fails to give JSON
        parsedData = { response: "Maaf kijiye Sir, samajh nahi aaya. Phir se boliye?", action: "NONE" };
      }

      setMessages(prev => [...prev, { role: 'ai', text: parsedData.response }]);
      speakText(parsedData.response);

      // Handle Actions
      if (parsedData.action === 'NAVIGATE_BOOKING') {
         setTimeout(() => {
            setIsOpen(false);
            onBooking();
         }, 2500);
      } else if (parsedData.action === 'CHECKOUT') {
         setTimeout(() => {
            setIsOpen(false);
            onCheckout();
         }, 2500);
      } else if (parsedData.action === 'ADD_TO_CART' && parsedData.item) {
         // Fuzzy find item
         const item = menu.find(m => m.name.toLowerCase().includes(parsedData.item!.toLowerCase()));
         if (item) {
             const qty = parsedData.quantity || 1;
             for(let i=0; i<qty; i++) addToCart(item);
         }
      }

    } catch (error) {
      console.error("AI Error:", error);
      const fallback = "Maaf kijiye Sir, network issue hai.";
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
                            onBooking();
                        }}
                        className="absolute right-6 p-4 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex flex-col items-center gap-1 shadow-md"
                        title="Book Table"
                    >
                        <Calendar size={24} />
                        <span className="text-[10px] font-bold">BOOK</span>
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