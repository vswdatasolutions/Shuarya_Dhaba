import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, MessageSquare, Loader2, Volume2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { MenuItem } from '../types';

interface VoiceAssistantProps {
  menu: MenuItem[];
  addToCart: (item: MenuItem) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ menu, addToCart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  // Initialize Gemini
  const apiKey = process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  // Load Voices on Mount with retry
  useEffect(() => {
    const loadVoices = () => {
      let available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };
    
    // Chrome requires this event
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    
    // Fallback retry
    const timer = setInterval(() => {
        if (voices.length === 0) loadVoices();
        else clearInterval(timer);
    }, 500);

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      clearInterval(timer);
    };
  }, [voices.length]);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN'; // Indian English handles Hindi accents better for mixed speech

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
    
    // Priority: Google Hindi -> Microsoft Hindi -> Indian English -> Default
    // Many Android phones have "Google Hindi" installed
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
    const indianEnglishVoice = voices.find(v => v.lang === 'en-IN');
    
    if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.rate = 1.0; 
        utterance.pitch = 1.0;
    } else if (indianEnglishVoice) {
        utterance.voice = indianEnglishVoice;
        utterance.rate = 0.9;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const handleUserMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsProcessing(true);

    try {
      const model = 'gemini-2.5-flash';
      
      const menuContext = menu.map(m => `${m.name} (${m.category}, ₹${m.price}, ${m.isVegetarian ? 'Veg' : 'Non-Veg'})`).join(', ');
      
      // Highly specific prompt for the "Raju" Dhaba Waiter Persona
      const systemPrompt = `
        You are 'Raju', an experienced, friendly, and authentic waiter at 'Shourya Wada Dhaba'.
        
        **Language:** Speak in mixed **Hindi (using Roman script)** and English (Hinglish).
        
        **Goal:** Help the customer order food by asking preferences first, then suggesting items.

        **Strict Interaction Flow:**
        1. **Preference Check:** If the user hasn't specified, ask "Veg ya Non-Veg lenge sir?"
        2. **Category Check:** If Veg/Non-Veg is known but dish isn't, ask "Rice, Roti ya Starters?"
        3. **Suggestion:** Suggest 2-3 specific popular items from the menu provided below based on their choice. Describe them appetizingly in 5-6 words.
        4. **Order Taking:** If they confirm a dish, say "Ji Sir, [Dish Name] add kar diya." and output the tag [ORDER: ItemName].

        **Menu Context:** ${menuContext}
        
        **Rules:**
        - Keep responses short (max 30 words).
        - Be polite ("Namaste", "Ji Sir", "Badhiya choice hai").
        - If user asks "What is special?", suggest 'Butter Chicken' or 'Dal Khichdi'.
        
        **Current User Input:** ${text}
      `;

      const chatHistory = messages.map(m => `${m.role === 'user' ? 'Customer' : 'Waiter'}: ${m.text}`).join('\n');
      const prompt = `${systemPrompt}\n\nChat History:\n${chatHistory}\nCustomer: ${text}\nWaiter:`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      const aiResponse = response.text.trim();
      
      // Parse Order Tag
      const orderMatch = aiResponse.match(/\[ORDER: (.*?)\]/);
      let displayResponse = aiResponse.replace(/\[ORDER: .*?\]/, '').trim();

      if (orderMatch) {
        const itemName = orderMatch[1];
        // Fuzzy search for item
        const item = menu.find(m => m.name.toLowerCase().includes(itemName.toLowerCase()));
        if (item) {
          addToCart(item);
        }
      }

      setMessages(prev => [...prev, { role: 'ai', text: displayResponse }]);
      speakText(displayResponse);

    } catch (error) {
      console.error("AI Error:", error);
      const fallback = "Maaf kijiye sir, network slow hai. Kya aap menu se select karenge?";
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
    // Ensure voices are loaded
    const available = window.speechSynthesis.getVoices();
    if (available.length > 0) setVoices(available);

    if (messages.length === 0) {
      const intro = "Namaste! Main Raju. Shourya Wada mein swagat hai. Aaj kya khayenge - Veg ya Non-Veg?";
      setMessages([{ role: 'ai', text: intro }]);
      // Small delay to ensure modal transition finishes before speaking
      setTimeout(() => speakText(intro), 500);
    }
  };

  return (
    <>
      {/* Floating Mic Button */}
      <button 
        onClick={startConversation}
        className="fixed bottom-24 right-4 md:bottom-20 z-[60] bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-full shadow-lg shadow-orange-500/50 hover:scale-110 transition-transform animate-bounce-slow border-2 border-white group"
        aria-label="Talk to AI Waiter"
      >
        <div className="absolute -top-10 right-0 bg-white text-gray-900 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none transform translate-y-2 group-hover:translate-y-0">
            Order by Voice 🎙️
        </div>
        <Mic size={28} />
      </button>

      {/* Chat Interface Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up relative">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 flex justify-between items-center text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full border border-white/20 backdrop-blur-md">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Raju - Digital Waiter</h3>
                  <p className="text-[10px] text-orange-100 uppercase tracking-wider font-bold opacity-90">Hindi Voice Ordering</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsOpen(false); synthRef.current.cancel(); }} 
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-orange-50/30 min-h-[300px]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
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
                      <span className="text-xs text-gray-500 font-medium italic">Soch raha hoon...</span>
                   </div>
                </div>
              )}
              <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })}></div>
            </div>

            {/* Mic Control Area */}
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

               <button 
                onClick={toggleListening}
                disabled={isProcessing}
                className={`p-6 rounded-full transition-all duration-300 transform ${
                  isListening 
                  ? 'bg-red-50 text-red-600 ring-4 ring-red-100 scale-110 shadow-inner' 
                  : 'bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95'
                }`}
               >
                 {isListening ? <MicOff size={32} /> : <Mic size={32} />}
               </button>
               
               <p className="text-xs text-gray-400 text-center max-w-[200px]">
                 {isListening ? "Boliye sir..." : "Tap mic and say 'Veg main kya hai?'"}
               </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};