import React from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  PhoneOff,
  Settings,
  MessageSquare
} from 'lucide-react';

interface ControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isChatOpen: boolean;
  isSettingsOpen: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
  onToggleChat: () => void;
  onToggleSettings: () => void;
  onLeave: () => void;
}

export const Controls = ({ 
  isMuted, 
  isVideoOff, 
  isChatOpen,
  isSettingsOpen,
  onToggleMute, 
  onToggleVideo, 
  onShareScreen, 
  onToggleChat,
  onToggleSettings,
  onLeave 
}: ControlsProps) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-[#022c2299] backdrop-blur-2xl border border-emerald-500/20 rounded-[32px] shadow-2xl z-50">
      <button
        onClick={onToggleMute}
        className={`p-4 rounded-2xl transition-all duration-300 ${
          isMuted 
            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
        }`}
      >
        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>

      <button
        onClick={onToggleVideo}
        className={`p-4 rounded-2xl transition-all duration-300 ${
          isVideoOff 
            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
        }`}
      >
        {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
      </button>

      <button
        onClick={onShareScreen}
        className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-300"
      >
        <MonitorUp className="w-6 h-6" />
      </button>

      <div className="w-px h-8 bg-emerald-500/10 mx-2" />

      <button
        onClick={onToggleChat}
        className={`p-4 rounded-2xl transition-all duration-300 ${
          isChatOpen 
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
        }`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <button
        onClick={onToggleSettings}
        className={`p-4 rounded-2xl transition-all duration-300 ${
          isSettingsOpen 
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
        }`}
      >
        <Settings className="w-6 h-6" />
      </button>

      <button
        onClick={onLeave}
        className="p-4 rounded-2xl bg-red-600/80 text-white border border-red-500/50 hover:bg-red-500 transition-all duration-300 shadow-lg shadow-red-900/20"
      >
        <PhoneOff className="w-6 h-6" />
      </button>
    </div>
  );
};
