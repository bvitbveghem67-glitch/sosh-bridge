import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
}

interface ChatProps {
  roomId: string;
  userDisplayName: string;
  onClose: () => void;
}

export const Chat = ({ roomId, userDisplayName, onClose }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    });

    return unsubscribe;
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      const messagesRef = collection(db, 'rooms', roomId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: auth.currentUser.uid,
        senderName: userDisplayName,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-80 h-full glass-panel flex flex-col overflow-hidden border-l border-emerald-500/10"
    >
      <div className="p-4 border-b border-emerald-500/10 flex items-center justify-between bg-emerald-500/5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-emerald-50">Room Chat</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-emerald-500/10 rounded-lg transition-colors">
          <X className="w-4 h-4 text-emerald-400/60" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-emerald-500/20"
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-emerald-400/40 font-bold mb-1 px-1">
                {isMe ? 'You' : msg.senderName}
              </span>
              <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                isMe 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-emerald-900/40 text-emerald-50 border border-emerald-500/10 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-emerald-500/5 border-t border-emerald-500/10">
        <div className="relative">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full bg-emerald-950/40 border border-emerald-500/20 rounded-xl py-3 pl-4 pr-12 text-xs text-emerald-50 placeholder-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};
