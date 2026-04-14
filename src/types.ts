export interface Member {
  uid: string;
  displayName: string;
  photoURL?: string;
  joinedAt: any;
  isMuted: boolean;
  isVideoOff: boolean;
}

export interface Room {
  id: string;
  name: string;
  createdBy: string;
  createdAt: any;
}
