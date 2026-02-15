
import React, { useState } from 'react';

interface SettingsModalProps {
  onClose: () => void;
  openaiKey: string;
  onSave: (key: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, openaiKey, onSave }) => {
  const [key, setKey] = useState(openaiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    onSave(key);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#111111] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-widest">AI Settings</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] ml-1">OpenAI API Key (sk-...)</label>
              <div className="relative">
                <input 
                  type={showKey ? "text" : "password"} 
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600/50 transition-all text-white text-sm"
                  placeholder="Enter sk-... key"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showKey ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.888 9.888L3 3m18 18l-6.888-6.888" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              <p className="text-[9px] text-gray-600 italic mt-2">Your key is stored locally in your browser and never sent to our servers.</p>
            </div>

            <button 
              onClick={handleSave}
              className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg hover:bg-gray-200"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
