import React, { useState } from 'react';
import { X, User, Shield, Info, Monitor, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsModalProps {
  displayName: string;
  onUpdateName: (name: string) => void;
  onClose: () => void;
}

export const SettingsModal = ({ displayName, onUpdateName, onClose }: SettingsModalProps) => {
  const [name, setName] = useState(displayName);

  const handleSave = () => {
    if (name.trim()) {
      onUpdateName(name);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#022c2299] backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md glass-panel overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-emerald-500/10 flex items-center justify-between bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-emerald-50">Node Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-500/10 rounded-xl transition-colors">
            <X className="w-5 h-5 text-emerald-400/60" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-bold text-emerald-500/50 uppercase tracking-widest ml-1">
              <User className="w-3 h-3" /> Display Name
            </label>
            <div className="relative group">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-6 py-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl text-emerald-50 placeholder-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500/40 uppercase tracking-widest">
                <Monitor className="w-3 h-3" /> Quality
              </div>
              <p className="text-sm font-bold text-emerald-100">720p HD</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500/40 uppercase tracking-widest">
                <Cpu className="w-3 h-3" /> Latency
              </div>
              <p className="text-sm font-bold text-emerald-100">~45ms</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-3">
            <Info className="w-5 h-5 text-emerald-400/60 shrink-0" />
            <p className="text-[11px] text-emerald-400/60 leading-relaxed">
              Your data is encrypted end-to-end. We don't store any video or audio data on our servers.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/40"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};
