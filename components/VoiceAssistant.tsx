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

  // Load Voices on Mount
  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
    };
    
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    // Cleanup
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      // Use Indian English/Hindi locale for better recognition of Indian names/accents
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
    
    // Logic to find the best voice for "Hinglish"
    // 1. Look for a specific Hindi voice
    // 2. Look for an Indian English voice ('en-IN')
    // 3. Fallback to default
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi'));
    const indianEnglishVoice = voices.find(v => v.lang === 'en-IN');
    
    if (hindiVoice) {
        utterance.voice = hindiVoice;
    } else if (indianEnglishVoice) {
        utterance.voice = indianEnglishVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.05; // Slightly higher pitch for a friendly waiter tone
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const handleUserMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsProcessing(true);

    try {
      const model = 'gemini-2.5-flash';
      
      const menuContext = menu.map(m => `${m.name} (${m.category}, ${m.isVegetarian ? 'Veg' : 'Non-Veg'})`).join(', ');
      
      const systemPrompt = `
        You are 'Raju', a friendly and respectful waiter at Shourya Wada Dhaba (a family restaurant). 
        
        **Language Rule:** Speak primarily in **Hindi mixed with English (Hinglish)**. Use Roman script for Hindi words so text-to-speech works well (e.g., "Kya lenge sir?", "Main check karta hoon").
        
        **Your Personality:** Authentic Indian Dhaba waiter. Humble, polite ("Sir/Ma'am"), and enthusiastic about the authentic food.
        
        **Order Taking Flow (Follow Strictly):**
        1. **Greeting:** (Already done).
        2. **Preference Check:** If the user asks "what's special", FIRST ask if they prefer **Veg or Non-Veg**.
        3. **Carb Check:** Then ask if they prefer **Rice** or **Roti/Naan**.
        4. **Suggestions:** 
           - If Veg: Suggest Paneer Butter Masala, Dal Khichdi, or Kaju Masala.
           - If Non-Veg: Suggest Butter Chicken or Mutton Handi.
        5. **Confirmation:** When they choose a dish, say "Ji Sir/Ma'am, [Item Name] add kar raha hoon." AND include the tag [ORDER: ItemName].
        
        **Menu Context:** ${menuContext}.
        
        **Important:** Keep responses short (under 25 words) so the conversation is fast.
      `;

      const chatHistory = messages.map(m => `${m.role === 'user' ? 'Customer' : 'Waiter'}: ${m.text}`).join('\n');
      const finalPrompt = `${systemPrompt}\n\nChat History:\n${chatHistory}\nCustomer: ${text}\nWaiter:`;

      const response = await ai.models.generateContent({
        model: model,
        contents: finalPrompt,
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
          // Don't change displayResponse, just let the AI confirmation speak
        }
      }

      setMessages(prev => [...prev, { role: 'ai', text: displayResponse }]);
      speakText(displayResponse);

    } catch (error) {
      console.error("AI Error:", error);
      const fallback = "Maaf kijiye, main sun nahi paya. Kya aap phir se bolenge?";
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
    // Only greet if it's the first time opening in this session
    if (messages.length === 0) {
      const intro = "Namaste! Shourya Wada Dhaba mein aapka swagat hai. Main Raju, aapka waiter. Aaj kya khayenge? Veg ya Non-Veg?";
      setMessages([{ role: 'ai', text: intro }]);
      // Slight delay to ensure modal is ready
      setTimeout(() => speakText(intro), 300);
    }
  };

  return (
    <>
      {/* Floating Mic Button */}
      <button 
        onClick={startConversation}
        className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-full shadow-lg shadow-orange-500/50 hover:scale-105 transition-transform animate-bounce-slow border-2 border-white group"
        aria-label="Voice Assistant"
      >
        <div className="absolute -top-10 right-0 bg-white text-gray-800 text-xs font-bold px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Talk to Waiter Raju
        </div>
        <Mic size={28} />
      </button>

      {/* Modal Interface */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up relative">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 flex justify-between items-center text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full border border-white/20">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">AI Waiter Raju</h3>
                  <p className="text-[10px] text-orange-100 uppercase tracking-wider font-bold opacity-90">Authentic Dhaba Service</p>
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
                    {msg.role === 'ai' && <span className="block text-[10px] font-bold text-orange-600 mb-1 uppercase">Raju</span>}
                    {msg.text}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start animate-fade-in">
                   <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-2.5">
                      <Loader2 size={16} className="animate-spin text-orange-600" />
                      <span className="text-xs text-gray-500 font-medium italic">Raju is thinking...</span>
                   </div>
                </div>
              )}
              {/* Spacer for scrolling */}
              <div className="h-2"></div>
            </div>

            {/* Controls */}
            <div className="p-6 bg-white border-t border-gray-100 flex flex-col items-center gap-4 relative">
               {/* Visualizer / Status Text */}
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm text-[10px] font-bold text-gray-500 flex items-center gap-2">
                  {isSpeaking ? (
                      <span className="flex items-center gap-1 text-orange-600">
                          <Volume2 size={12} /> Speaking
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
                 {isListening ? "Listening... Speak now" : "Tap the button to order in Hindi"}
               </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
