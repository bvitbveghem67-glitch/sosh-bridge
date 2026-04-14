import React from 'react';
import { Member } from '../types';
import { Mic, MicOff, Video, VideoOff, User } from 'lucide-react';

interface MemberListProps {
  members: Member[];
}

export const MemberList = ({ members }: MemberListProps) => {
  return (
    <div className="w-[300px] flex flex-col gap-5 h-full">
      <div className="glass-panel flex-1 flex flex-col overflow-hidden p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-emerald-50 tracking-tight">
            Members
          </h2>
          <span className="text-[12px] font-medium text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
            {members.length} online
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 pr-2">
          {members.map((member) => (
            <div 
              key={member.uid} 
              className="flex items-center justify-between py-3 border-b border-emerald-500/10 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center overflow-hidden border border-emerald-400/30">
                  {member.photoURL ? (
                    <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xs font-bold text-white">{member.displayName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-emerald-50">
                    {member.displayName}
                  </span>
                  <span className="text-[11px] text-emerald-400/70">
                    {member.isMuted ? 'Muted' : 'Speaking'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                {member.isMuted ? (
                  <MicOff className="w-4 h-4 text-red-400" />
                ) : (
                  <Mic className="w-4 h-4 text-emerald-400" />
                )}
                {member.isVideoOff ? (
                  <VideoOff className="w-4 h-4 text-red-400" />
                ) : (
                  <Video className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel h-[120px] p-6">
        <div className="text-[14px] font-semibold mb-2 text-emerald-50">Primary Audio Stream</div>
        <div className="flex items-end gap-[3px] h-10 mt-2">
          {[20, 45, 70, 90, 85, 60, 40, 30, 55, 75, 95, 65, 40, 20, 15].map((h, i) => (
            <div 
              key={i} 
              className="flex-1 bg-emerald-500 rounded-[2px] shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
              style={{ height: `${h}%` }} 
            />
          ))}
        </div>
        <div className="text-[10px] mt-2 opacity-50 text-emerald-400 text-center uppercase tracking-wider">
          Latency: 24ms • Bitrate: 128kbps
        </div>
      </div>
    </div>
  );
};
