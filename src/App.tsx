import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, loginAnonymously } from './lib/firebase';
import { useWebRTC } from './hooks/useWebRTC';
import { VideoGrid } from './components/VideoGrid';
import { MemberList } from './components/MemberList';
import { Controls } from './components/Controls';
import { RoomSelection } from './components/RoomSelection';
import { Chat } from './components/Chat';
import { SettingsModal } from './components/SettingsModal';
import { Member } from './types';
import { Video, ShieldCheck, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [tempProfile, setTempProfile] = useState<{ name: string; photo: string } | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const {
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    shareScreen,
    permissionError,
    retryPermissions
  } = useWebRTC(roomId, tempProfile);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl && roomFromUrl.length === 6) {
      setRoomId(roomFromUrl);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          const cred = await loginAnonymously();
          setUser(cred.user);
        } else {
          setUser(u);
        }
        
        if (!tempProfile) {
          const names = ['Stellar', 'Nova', 'Cosmo', 'Astro', 'Nebula', 'Orion', 'Luna', 'Solar'];
          const randomName = `${names[Math.floor(Math.random() * names.length)]} ${Math.floor(Math.random() * 1000)}`;
          const randomPhoto = `https://picsum.photos/seed/${randomName}/200`;
          setTempProfile({ name: randomName, photo: randomPhoto });
        }
        
        setIsAuthReady(true);
      } catch (err: any) {
        console.error("Auth error:", err);
        if (err.code === 'auth/admin-restricted-operation') {
          setAppError("Anonymous Authentication is disabled. Please enable it in your Firebase Console: Authentication > Sign-in method > Add new provider > Anonymous.");
        } else if (err.code === 'auth/network-request-failed') {
          setAppError("Network error: Firebase could not be reached. This is often caused by ad-blockers, strict firewalls, or poor internet connection. Please try disabling ad-blockers or checking your network.");
        } else {
          setAppError(err instanceof Error ? err.message : "Authentication failed");
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!roomId) {
      setMembers([]);
      return;
    }

    const membersRef = collection(db, 'rooms', roomId, 'members');
    const q = query(membersRef, orderBy('joinedAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersList = snapshot.docs.map(doc => doc.data() as Member);
      setMembers(membersList);
    }, (error) => {
      setAppError(error.message);
    });

    return unsubscribe;
  }, [roomId]);

  const handleCreateRoom = async () => {
    if (!user) return;
    try {
      // Generate a 6-digit numeric code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      await setDoc(doc(db, 'rooms', code), {
        name: `Room ${code}`,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      
      setRoomId(code);
      setCreatedRoomId(null);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "Failed to create room");
    }
  };

  const handleJoinRoom = (id: string) => {
    setRoomId(id);
    setCreatedRoomId(null);
  };

  const handleLeave = () => {
    setRoomId(null);
    setCreatedRoomId(null);
    setIsChatOpen(false);
    setIsSettingsOpen(false);
  };

  const handleUpdateName = async (newName: string) => {
    if (!tempProfile || !user || !roomId) return;
    
    setTempProfile({ ...tempProfile, name: newName });
    
    try {
      const memberDoc = doc(db, 'rooms', roomId, 'members', user.uid);
      await updateDoc(memberDoc, { displayName: newName });
    } catch (error) {
      console.error('Error updating name:', error);
    }
  };

  if (appError) {
    return (
      <div className="min-h-screen bg-[#022c22] flex items-center justify-center p-6">
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-6">
          <div className="inline-flex p-4 bg-red-500/10 rounded-full border border-red-500/20">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-50">System Error</h2>
          <p className="text-emerald-400/70 text-sm leading-relaxed">{appError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Reload Application
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#022c22] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-emerald-50 selection:bg-emerald-500/30 p-5">
      <AnimatePresence mode="wait">
        {!roomId ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RoomSelection 
              onJoin={handleJoinRoom} 
              onCreate={handleCreateRoom} 
              createdRoomId={createdRoomId}
              onPrepareMedia={retryPermissions}
            />
          </motion.div>
        ) : (
          <motion.div
            key="room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[calc(100vh-40px)] gap-5"
          >
            <div className="flex-1 flex flex-col gap-5 relative">
              {/* Header */}
              <header className="h-20 px-8 flex items-center justify-between glass-panel z-40">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                    <Video className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-emerald-50 tracking-tight">SOSH Nodes</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-400/60 font-mono uppercase tracking-widest">Room Code:</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{roomId}</span>
                      <button 
                        onClick={handleCopyLink}
                        className="p-1 hover:bg-emerald-500/10 rounded-md transition-colors group relative"
                        title="Copy Invite Link"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-emerald-400/60" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {members.slice(0, 3).map((m) => (
                      <div key={m.uid} className="w-8 h-8 rounded-full border-2 border-emerald-500/20 bg-emerald-900/40 overflow-hidden">
                        {m.photoURL ? <img src={m.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">{m.displayName[0]}</div>}
                      </div>
                    ))}
                    {members.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 bg-emerald-900/40 flex items-center justify-center text-[10px] font-bold text-emerald-400/60">
                        +{members.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </header>

              {/* Main Video Area */}
              <main className="flex-1 overflow-y-auto relative">
                {permissionError || !localStream ? (
                  <div className="absolute inset-0 flex items-center justify-center p-6 z-50">
                    <div className="glass-panel p-10 max-w-md w-full text-center space-y-6 bg-[#022c22cc]">
                      <div className="inline-flex p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <ShieldCheck className="w-12 h-12 text-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xl font-bold text-emerald-50">Permissions Required</h2>
                        <p className="text-emerald-400/70 text-sm leading-relaxed">
                          We need access to your camera and microphone to start the call and see other members.
                        </p>
                      </div>
                      <button 
                        onClick={() => retryPermissions()}
                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
                      >
                        <RefreshCw className="w-5 h-5" /> Enable Camera & Mic
                      </button>
                      {permissionError && (
                        <p className="text-red-400/60 text-[10px] font-mono">{permissionError}</p>
                      )}
                    </div>
                  </div>
                ) : null}
                <VideoGrid 
                  localStream={localStream} 
                  remoteStreams={remoteStreams} 
                  memberNames={new Map(members.map(m => [m.uid, m.displayName]))}
                />
              </main>

              {/* Controls Overlay */}
              <Controls 
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                isChatOpen={isChatOpen}
                isSettingsOpen={isSettingsOpen}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                onShareScreen={shareScreen}
                onToggleChat={() => setIsChatOpen(!isChatOpen)}
                onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
                onLeave={handleLeave}
              />
            </div>

            {/* Sidebar / Chat */}
            <AnimatePresence>
              {isChatOpen ? (
                <Chat 
                  roomId={roomId} 
                  userDisplayName={tempProfile?.name || 'Anonymous'} 
                  onClose={() => setIsChatOpen(false)} 
                />
              ) : (
                <MemberList members={members} />
              )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
              {isSettingsOpen && (
                <SettingsModal 
                  displayName={tempProfile?.name || ''} 
                  onUpdateName={handleUpdateName}
                  onClose={() => setIsSettingsOpen(false)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
