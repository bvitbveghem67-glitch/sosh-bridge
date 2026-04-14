import React, { useEffect, useRef } from 'react';

interface VideoProps {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  isLocal?: boolean;
  key?: string;
}

const Video = ({ stream, muted, label, isLocal }: VideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative group w-full h-full glass-panel overflow-hidden rounded-[24px] border border-emerald-500/10 bg-emerald-950/20`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted || isLocal}
        className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/60 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 animate-pulse">
            <span className="text-xl font-bold text-emerald-400">{label[0]}</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
        <div className={`w-1.5 h-1.5 rounded-full ${stream ? 'bg-emerald-400' : 'bg-red-400'} shadow-[0_0_8px_rgba(52,211,153,0.4)]`} />
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
};

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  memberNames: Map<string, string>;
}

export const VideoGrid = ({ localStream, remoteStreams, memberNames }: VideoGridProps) => {
  const streams = Array.from(remoteStreams.entries());
  const totalParticipants = streams.length + 1;

  return (
    <div className="w-full h-full p-2">
      <div className={`grid gap-4 h-full w-full ${
        totalParticipants === 1 ? 'grid-cols-1' :
        totalParticipants === 2 ? 'grid-cols-2' :
        totalParticipants <= 4 ? 'grid-cols-2 grid-rows-2' :
        'grid-cols-3 grid-rows-2'
      }`}>
        <Video stream={localStream} label="You" isLocal />
        {streams.map(([id, stream]) => (
          <Video 
            key={id}
            stream={stream} 
            label={memberNames.get(id) || 'Remote User'} 
          />
        ))}
      </div>
    </div>
  );
};
