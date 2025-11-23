
export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  bio?: string;
  skillLevel?: 'Casual' | 'Competitive' | 'Pro';
  location?: string;
  settings: {
    notifications: boolean;
    publicProfile: boolean;
  };
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Participant {
  userId: string;
  status: 'confirmed' | 'maybe';
  teamName?: string; // Optional team name for tournaments
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  type: 'general' | 'venue' | 'game';
  privacy: 'public' | 'private';
  adminIds: string[]; // IDs of users who can manage the channel
  icon?: string; // URL or identifier
  participants: string[]; // User IDs
  messages: Message[];
  contextId?: string; // Link to GameID or VenueID if applicable
  lastMessageAt: number;
}

export interface BracketMatch {
  id: string;
  round: number; // 1 = Round of 8, 2 = Semis, 3 = Finals
  matchIndex: number; // 0-based index in the round
  player1Id?: string;
  player2Id?: string;
  score1?: number;
  score2?: number;
  winnerId?: string;
  nextMatchId?: string; // ID of the match the winner advances to
}

export interface Game {
  id: string;
  hostId: string; // User ID of the creator
  venueName: string;
  address?: string; // Derived from map data if available
  startTime: string;
  date: string;
  participants: Participant[];
  maxPlayers: number;
  level: 'Casual' | 'Competitive' | 'All Levels';
  privacy: 'public' | 'invite-only';
  status: 'scheduled' | 'cancelled' | 'active' | 'completed';
  type: 'standard' | 'tournament';
  
  // Tournament Specifics
  tournamentConfig?: {
    entryFee: number;
    bracketSize: 4 | 8 | 16 | 32;
    prizePool?: string;
  };
  bracket?: BracketMatch[];

  // chatMessages is deprecated in favor of ChatChannel, but kept for backward compat in mock data init
  chatMessages: Message[]; 
}

// Queue System Types
export interface QueueTeam {
  id: string;
  name: string; // "Team Jordan" or "John Doe"
  players: User[];
  timestamp: number;
  size: number;
}

export interface Court {
  id: string;
  name: string; // "Main Court", "East Court"
  format: '1v1' | '2v2' | '3v3' | '4v4' | '5v5' | 'Shootaround';
  queue: QueueTeam[];
  currentMatch?: {
    teamA: QueueTeam;
    teamB: QueueTeam;
    startTime: number;
  };
}

export interface Venue {
  id: string; // Using venue name as ID for simplicity in this demo
  name: string;
  address?: string;
  courts: Court[];
  games: Game[]; // Scheduled games at this venue
}

export interface VenueSuggestion {
  name: string;
  address: string;
  uri?: string; // Google Maps URI
  rating?: string;
}

export interface GroundingChunk {
  maps?: {
    uri?: string;
    title?: string;
    placeId?: string;
  };
}

export interface ParsedVenueMetadata {
  type: 'Indoor' | 'Outdoor' | 'Unknown';
  rating: string;
  desc: string;
  lat?: number;
  lng?: number;
  // Suitability Factors
  surface?: 'Hardwood' | 'Concrete' | 'Asphalt' | 'Rubber' | 'Unknown';
  lighting?: boolean; // Has lights for night play
  access?: 'Public' | 'Private' | 'Membership' | 'Paid';
}

export enum AppView {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  HOME = 'HOME',
  VENUE_SEARCH = 'VENUE_SEARCH',
  VENUE_DETAILS = 'VENUE_DETAILS',
  GAME_DETAILS = 'GAME_DETAILS',
  CREATE_GAME = 'CREATE_GAME',
  PROFILE = 'PROFILE',
  MESSAGES = 'MESSAGES',
  MY_GAMES = 'MY_GAMES'
}
