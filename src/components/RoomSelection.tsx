import React, { useState } from 'react';
import { Video, Plus, LogIn, Sparkles, Copy, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoomSelectionProps {
  onJoin: (roomId: string) => void;
  onCreate: () => void;
  createdRoomId?: string | null;
  onPrepareMedia: () => void;
}

export const RoomSelection = ({ onJoin, onCreate, createdRoomId, onPrepareMedia }: RoomSelectionProps) => {
  const [roomId, setRoomId] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (createdRoomId) {
      navigator.clipboard.writeText(createdRoomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = () => {
    if (roomId.length === 6) {
      onPrepareMedia();
      onJoin(roomId);
    }
  };

  const handleCreate = () => {
    onPrepareMedia();
    onCreate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 glass-panel">
            <Video className="w-10 h-10 text-emerald-300" />
          </div>
          <h1 className="text-4xl font-bold text-emerald-50 tracking-tight">SOSH Nodes</h1>
          <p className="text-emerald-400/60 text-sm max-w-[280px] mx-auto leading-relaxed">
            Instant video calls. No accounts. Just a code.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {createdRoomId ? (
            <motion.div
              key="created"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 glass-panel space-y-6 text-center"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-emerald-50">Room Created!</h2>
                <p className="text-sm text-emerald-400/60">Share this code with others to join.</p>
              </div>
              
              <div className="relative group">
                <div className="w-full px-6 py-4 bg-emerald-900/20 border border-emerald-500/20 rounded-2xl text-emerald-50 font-mono text-2xl font-bold tracking-[0.5em] text-center">
                  {createdRoomId}
                </div>
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-2 p-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <button
                onClick={() => onJoin(createdRoomId)}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
              >
                Enter Meeting <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 glass-panel space-y-8"
            >
              <div className="space-y-4">
                <button
                  onClick={handleCreate}
                  className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/40 group"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                  Start New Meeting
                </button>
                <p className="text-[10px] text-center text-emerald-500/40 font-medium uppercase tracking-[0.2em]">Generates a 6-digit code</p>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-emerald-500/10 flex-1" />
                <span className="text-[10px] font-bold text-emerald-500/20 uppercase tracking-widest">OR</span>
                <div className="h-px bg-emerald-500/10 flex-1" />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-semibold text-emerald-500/50 uppercase tracking-widest ml-1">Join with Code</label>
                <div className="relative group">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code..."
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-6 py-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl text-emerald-50 placeholder-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 font-mono text-center text-lg tracking-widest"
                  />
                  <button
                    onClick={handleJoin}
                    disabled={roomId.length !== 6}
                    className="absolute right-2 top-2 p-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                  >
                    <LogIn className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-2 text-emerald-500/40 text-[10px] font-medium uppercase tracking-widest">
          <Sparkles className="w-3 h-3 text-emerald-300" />
          Powered by WebRTC & Firebase
        </div>
      </motion.div>
    </div>
  );
};
