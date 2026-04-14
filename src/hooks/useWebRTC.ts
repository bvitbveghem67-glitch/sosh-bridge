import { useEffect, useRef, useState } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  addDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(roomId: string | null, tempProfile: { name: string; photo: string } | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const setupLocalStream = async () => {
    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      let msg = 'Could not access camera/microphone';
      if (error.name === 'NotAllowedError' || error.message === 'Permission denied') {
        msg = 'Camera/Mic access was denied. Please click the "Lock" icon in your browser address bar and set Camera and Microphone to "Allow", then try again.';
      }
      setPermissionError(msg);
      return null;
    }
  };

  useEffect(() => {
    // We no longer auto-trigger setupLocalStream here to avoid "Permission denied" 
    // without user gesture. It's triggered by the Join/Create buttons.
  }, [roomId]);

  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, [localStream]);

  useEffect(() => {
    if (!roomId || !auth.currentUser || !tempProfile) return;

    const user = auth.currentUser;
    const membersRef = collection(db, 'rooms', roomId, 'members');
    const memberDoc = doc(membersRef, user.uid);

    const registerMember = async () => {
      try {
        await setDoc(memberDoc, {
          uid: user.uid,
          displayName: tempProfile.name,
          photoURL: tempProfile.photo,
          joinedAt: serverTimestamp(),
          isMuted,
          isVideoOff,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `rooms/${roomId}/members/${user.uid}`);
      }
    };

    registerMember();

    // Listen for other members to initiate connections
    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const memberData = change.doc.data();
        const memberId = change.doc.id;

        if (memberId === user.uid) return;

        if (change.type === 'added') {
          // We only initiate if we have a local stream
          if (user.uid < memberId) {
            initiateCall(memberId);
          }
        } else if (change.type === 'removed') {
          const pc = peerConnections.current.get(memberId);
          if (pc) {
            pc.close();
            peerConnections.current.delete(memberId);
            setRemoteStreams(prev => {
              const next = new Map(prev);
              next.delete(memberId);
              return next;
            });
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${roomId}/members`);
    });

    // Listen for incoming calls (offers) directed at us
    const callsRef = collection(db, 'calls');
    const q = query(callsRef, where('receiverId', '==', user.uid), where('roomId', '==', roomId));
    const unsubscribeCalls = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const callData = change.doc.data();
          if (!callData.answer) {
            handleIncomingCall(change.doc.id, callData);
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `calls`);
    });

    return () => {
      unsubscribe();
      unsubscribeCalls();
      deleteDoc(memberDoc).catch(e => console.error("Cleanup error:", e));
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      setRemoteStreams(new Map());
    };
  }, [roomId, tempProfile]); // Removed localStream from dependencies

  // Update member state when muted/video toggled
  useEffect(() => {
    if (!roomId || !auth.currentUser) return;
    const memberDoc = doc(db, 'rooms', roomId, 'members', auth.currentUser.uid);
    updateDoc(memberDoc, { isMuted, isVideoOff }).catch(console.error);
  }, [isMuted, isVideoOff, roomId]);

  async function initiateCall(targetId: string) {
    if (!auth.currentUser || !roomId) return;

    // Wait for local stream if not ready
    let stream = localStream;
    if (!stream) {
      stream = await setupLocalStream();
    }
    if (!stream) return;

    const pc = new RTCPeerConnection(servers);
    peerConnections.current.set(targetId, pc);

    stream.getTracks().forEach(track => pc.addTrack(track, stream!));

    pc.ontrack = (event) => {
      setRemoteStreams(prev => new Map(prev).set(targetId, event.streams[0]));
    };

    const callDoc = doc(collection(db, 'calls'));
    const offerCandidates = collection(callDoc, 'offerCandidates');
    const answerCandidates = collection(callDoc, 'answerCandidates');

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDoc, {
      offer,
      callerId: auth.currentUser.uid,
      receiverId: targetId,
      roomId,
      createdAt: serverTimestamp(),
    });

    // Listen for answer
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // Listen for remote ICE candidates
    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  }

  async function handleIncomingCall(callId: string, callData: any) {
    if (!auth.currentUser) return;

    // Wait for local stream if not ready
    let stream = localStream;
    if (!stream) {
      stream = await setupLocalStream();
    }
    if (!stream) return;

    const pc = new RTCPeerConnection(servers);
    peerConnections.current.set(callData.callerId, pc);

    stream.getTracks().forEach(track => pc.addTrack(track, stream!));

    pc.ontrack = (event) => {
      setRemoteStreams(prev => new Map(prev).set(callData.callerId, event.streams[0]));
    };

    const callDoc = doc(db, 'calls', callId);
    const offerCandidates = collection(callDoc, 'offerCandidates');
    const answerCandidates = collection(callDoc, 'answerCandidates');

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, { answer });

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoTrack = screenStream.getVideoTracks()[0];
      
      peerConnections.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      videoTrack.onended = () => {
        if (localStream) {
          const localVideoTrack = localStream.getVideoTracks()[0];
          peerConnections.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(localVideoTrack);
            }
          });
        }
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  return {
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    shareScreen,
    permissionError,
    retryPermissions: setupLocalStream
  };
}
