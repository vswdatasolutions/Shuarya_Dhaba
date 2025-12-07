import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, MessageSquare, Loader2, Volume2, AlertCircle, Plus } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { MenuItem } from '../types';

interface VoiceAssistantProps {
  menu: MenuItem[];
  addToCart: (item: MenuItem) => void;
  onCheckout: () => void;
  onBooking: (details?: { people?: number, time?: string }) => void;
}

interface AIResponse {
  response: string;
  action: 'ADD_TO_CART' | 'CHECKOUT' | 'NAVIGATE_BOOKING' | 'NONE';
  item?: string;
  quantity?: number;
  people?: number;
  time?: string;
  recommendations?: string[]; // List of Item IDs to show cards
}

interface ChatMessage {
    role: 'user' | 'ai';
    text: string;
    recommendations?: string[];
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ menu, addToCart, onCheckout, onBooking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      // We use Indian English as the base because it often captures regional accents and Hinglish better than strict en-US
      recognitionRef.current.lang = 'en-IN'; 

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim().length > 0) {
            handleUserMessage(transcript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
            setSpeechError("Silence detected. Tap to speak.");
        } else if (event.error === 'not-allowed') {
            setSpeechError("Mic permission denied.");
        } else if (event.error === 'network') {
            setSpeechError("Network error. Check internet.");
        } else {
            setSpeechError("Error. Tap to retry.");
        }
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

  const saveTrainingData = (input: string, action: string, details?: any) => {
    try {
        const existingData = localStorage.getItem('dhaba_learning_logs');
        const logs = existingData ? JSON.parse(existingData) : [];
        logs.push({
            timestamp: new Date().toISOString(),
            input,
            action,
            details,
            languageDetected: 'mixed-indian-polyglot' 
        });
        if (logs.length > 50) logs.shift();
        localStorage.setItem('dhaba_learning_logs', JSON.stringify(logs));
    } catch (e) {
        console.warn("Could not save training data", e);
    }
  };

  /**
   * SMART OFFLINE FALLBACK (Local Logic Engine)
   */
  const generateMockResponse = (text: string): AIResponse => {
    const lowerText = text.toLowerCase();
    
    // 1. Check for Menu Items
    for (const item of menu) {
        if (lowerText.includes(item.name.toLowerCase()) || 
           (item.name.includes("chicken") && lowerText.includes("chicken")) ||
           (item.name.includes("paneer") && lowerText.includes("paneer")) ||
           (item.name.includes("dal") && lowerText.includes("dal"))) {
             
            let qty = 1;
            if (lowerText.includes("2") || lowerText.includes("do")) qty = 2;
            if (lowerText.includes("3") || lowerText.includes("teen")) qty = 3;
            if (lowerText.includes("4") || lowerText.includes("chaar")) qty = 4;

            return {
                response: `Ji Sir, ${qty} ${item.name} add kar diya hai. Aur kuch?`,
                action: 'ADD_TO_CART',
                item: item.name, 
                quantity: qty
            };
        }
    }

    // 2. Booking Intent
    if (lowerText.includes("book") || lowerText.includes("table") || lowerText.includes("seat") || lowerText.includes("reserve") || lowerText.includes("pahije") || lowerText.includes("beku")) {
        const peopleMatch = text.match(/(\d+)/);
        const people = peopleMatch ? parseInt(peopleMatch[0]) : 2;

        return {
            response: `Ji Sir, ${people} logon ke liye table booking open kar raha hoon.`,
            action: 'NAVIGATE_BOOKING',
            people: people
        };
    }

    // 3. Checkout Intent
    if (lowerText.includes("bill") || lowerText.includes("check") || lowerText.includes("pay") || lowerText.includes("order") || lowerText.includes("dya") || lowerText.includes("kodi")) {
        return {
            response: "Ji Sir, main aapka bill ready kar raha hoon.",
            action: 'CHECKOUT'
        };
    }

    // 4. Menu/Recommendation Intent -> Show Cards
    if (lowerText.includes("menu") || lowerText.includes("recommend") || lowerText.includes("kya hai") || lowerText.includes("badiya") || lowerText.includes("show")) {
        // Return popular items
        const popularIds = menu.filter(m => m.price > 200).slice(0, 4).map(m => m.id);
        return {
            response: "Ye rahe hamare kuch khaas Dhaba specials. Touch karke add karein:",
            action: 'NONE',
            recommendations: popularIds
        };
    }

    // 5. Greetings
    if (lowerText.includes("hi") || lowerText.includes("hello") || lowerText.includes("namaste")) {
        return {
            response: "Namaste Sir! Shourya Wada mein aapka swagat hai. Kya order karenge?",
            action: 'NONE'
        };
    }

    return {
        response: "Maaf kijiye Sir, main samjha nahi. Kya aap menu dekhna chahenge?",
        action: 'NONE',
        // Fallback recommendations if user is confused
        recommendations: menu.slice(0, 3).map(m => m.id)
    };
  };

  const handleUserMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsProcessing(true);
    setSpeechError(null);

    try {
      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        throw new Error("No API Key");
      }

      const model = 'gemini-2.5-flash';
      
      const menuContext = menu.map(m => `${m.id}: ${m.name} (₹${m.price})`).join(', ');
      
      const systemPrompt = `
        You are 'Raju', a smart and polite waiter at 'Shourya Wada Dhaba'.
        
        **MULTILINGUAL CAPABILITIES:**
        User may speak in English, Hindi, Marathi, or Kannada.
        You MUST respond in Roman Script (Hinglish/Transliterated) so the audio engine can read it.
        
        **CONVERSATIONAL FLOWS (Follow these patterns closely):**

        **Hinglish Flow:**
        User: "Veg" -> You: "Veg perfect! Rice pasand karte ho ya Roti?"
        User: "Rice" -> You: "Toh aapke liye best recommendation — Dal Khichdi ya Jeera Rice + Paneer Butter Masala. Kya order karu?"

        **Hindi Flow:**
        User: "Non-veg" -> You: "Bahut badiya! Chicken ya Mutton mein se kya prefer karte hain?"
        User: "Chicken" -> You: "Humare special mein aaj Butter Chicken aur Lasoon Chicken Soup hai. Main order place kar doon?"

        **Marathi Flow (Respond in Roman Marathi/Hinglish):**
        User: "Veg" -> You: "Chhan! Bhaat ki Poli aavadte?"
        User: "Bhaat" -> You: "Mag tumchyasathi uttam option — Dal Khichdi kivva Jeera Rice + Kaju Masala. Order karu ka?"

        **Kannada Flow (Respond in Roman Kannada/Hinglish):**
        User: "Veg" -> You: "Rice ishtana athava Roti?"
        User: "Rice" -> You: "Haagidre nimge suit aagodu — Dal Khichdi athava Jeera Rice + Paneer Masala. Order confirm madbahuda?"

        **YOUR TASK:**
        1. Identify intent (Ordering, Booking, Checkout).
        2. **Response:** Speak strictly in **Hinglish/Roman Script** based on the detected language flow above.
        3. **Visuals:** If user asks for menu/recommendations, return matching Item IDs in 'recommendations' array.
        4. **Confirmations:** When adding items, explicitly say "Ji Sir, [Item] add kar diya".

        **OUTPUT FORMAT (Strict JSON):**
        {
          "response": "Speech text in Roman Script",
          "action": "ADD_TO_CART" | "CHECKOUT" | "NAVIGATE_BOOKING" | "NONE",
          "item": "Item Name",
          "quantity": 1,
          "people": 4,
          "recommendations": ["id1", "id2"]
        }

        **Menu:** ${menuContext}
        **User Input:** "${text}"
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: systemPrompt,
        config: { responseMimeType: "application/json" }
      });

      const jsonText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData: AIResponse = JSON.parse(jsonText);

      setMessages(prev => [...prev, { role: 'ai', text: parsedData.response, recommendations: parsedData.recommendations }]);
      speakText(parsedData.response);
      handleActions(parsedData, text);

    } catch (error) {
      console.log("Using Offline Fallback Mode");
      const mockResponse = generateMockResponse(text);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', text: mockResponse.response, recommendations: mockResponse.recommendations }]);
        speakText(mockResponse.response);
        handleActions(mockResponse, text);
      }, 800);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActions = (data: AIResponse, originalInput: string) => {
      if (data.action !== 'NONE') {
          saveTrainingData(originalInput, data.action, { item: data.item, people: data.people });
      }

      if (data.action === 'NAVIGATE_BOOKING') {
         setTimeout(() => {
            setIsOpen(false);
            onBooking({ people: data.people, time: data.time });
         }, 2500);
      } else if (data.action === 'CHECKOUT') {
         setTimeout(() => {
            setIsOpen(false);
            onCheckout();
         }, 2500);
      } else if (data.action === 'ADD_TO_CART' && data.item) {
         const targetName = data.item.toLowerCase();
         const item = menu.find(m => {
            const menuName = m.name.toLowerCase();
            return menuName.includes(targetName) || targetName.includes(menuName);
         });
         
         if (item) {
             const qty = data.quantity || 1;
             for(let i=0; i<qty; i++) addToCart(item);
         }
      }
  };

  const toggleListening = () => {
    setSpeechError(null);
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (isSpeaking) {
        synthRef.current.cancel();
      }
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Mic start failed", e);
        setSpeechError("Mic Error. Refresh.");
      }
    }
  };

  const startConversation = () => {
    setIsOpen(true);
    setSpeechError(null);
    if (messages.length === 0) {
      const intro = "Namaste! Shourya Wada mein aapka swagat hai. Kya khaenge aaj?";
      setMessages([{ role: 'ai', text: intro }]);
      setTimeout(() => speakText(intro), 500);
    }
  };

  return (
    <>
      {/* Floating Mic Button */}
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
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh] md:max-h-[700px] animate-slide-up relative">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 flex justify-between items-center text-white shadow-md flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full border border-white/20 backdrop-blur-md">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl leading-tight">Raju (Waiter)</h3>
                  <p className="text-[10px] text-orange-100 uppercase tracking-wider font-bold opacity-90">AI Voice Assistant</p>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-orange-50/30">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
                  
                  {/* Text Bubble */}
                  <div className={`max-w-[85%] p-4 rounded-2xl text-base font-medium leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-gray-800 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}>
                    {msg.role === 'ai' && <span className="block text-[10px] font-bold text-orange-600 mb-1 uppercase tracking-wider">Raju</span>}
                    {msg.text}
                  </div>

                  {/* Visual Menu Cards (If Recommendations exist) */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="w-full mt-3 overflow-x-auto no-scrollbar pb-2">
                          <div className="flex gap-3 px-1">
                              {msg.recommendations.map(itemId => {
                                  const item = menu.find(m => m.id === itemId);
                                  if (!item) return null;
                                  return (
                                      <div key={itemId} className="flex-shrink-0 w-40 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
                                          <div className="h-24 bg-gray-100 overflow-hidden">
                                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                          </div>
                                          <div className="p-3 flex flex-col flex-1">
                                              <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                                              <p className="text-xs text-gray-500 mb-2">₹{item.price}</p>
                                              <button 
                                                  onClick={() => {
                                                      addToCart(item);
                                                      speakText(`${item.name} added.`);
                                                  }}
                                                  className="mt-auto bg-orange-100 text-orange-700 text-xs font-bold py-1.5 rounded-lg hover:bg-orange-600 hover:text-white transition-colors flex items-center justify-center gap-1"
                                              >
                                                  ADD <Plus size={12} strokeWidth={3} />
                                              </button>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )}
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start animate-fade-in">
                   <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-2.5">
                      <Loader2 size={16} className="animate-spin text-orange-600" />
                      <span className="text-xs text-gray-500 font-medium italic">Sun raha hoon...</span>
                   </div>
                </div>
              )}
              <div ref={chatEndRef}></div>
            </div>

            {/* Mic Control Area */}
            <div className="p-6 bg-white border-t border-gray-100 flex flex-col items-center gap-4 flex-shrink-0 relative">
               
               {/* Status Pill */}
               <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full shadow-sm text-[10px] font-bold flex items-center gap-2 border ${speechError ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-500'}`}>
                  {speechError ? (
                      <span className="flex items-center gap-1">
                          <AlertCircle size={12} /> {speechError}
                      </span>
                  ) : isSpeaking ? (
                      <span className="flex items-center gap-1 text-orange-600">
                          <Volume2 size={12} className="animate-pulse" /> Speaking
                      </span>
                  ) : isListening ? (
                      <span className="flex items-center gap-1 text-red-600 animate-pulse">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> Listening...
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