
import React, { useState, useEffect } from 'react';
import { ICONS, MOCK_GAMES, MOCK_USERS } from './constants';
import { AppView, Game, Message, User, Venue, Court, ChatChannel, BracketMatch } from './types';
import { Button } from './components/Button';
import { VenueSearch } from './components/VenueSearch';
import { ChatRoom } from './components/ChatRoom';
import { MessagesPage } from './components/MessagesPage';
import { CreateGameModal } from './components/CreateGameModal';
import { LandingPage } from './components/LandingPage';
import { AuthForm } from './components/Auth';
import { ProfilePage } from './components/ProfilePage';
import { VenueDetails } from './components/VenueDetails';
import { GameDetailsModal } from './components/GameDetailsModal';
import { MyGamesPage } from './components/MyGamesPage';

// Initial Mock User
const MOCK_USER_TEMPLATE: User = {
  id: 'user-1',
  name: 'Jordan',
  avatar: 'https://picsum.photos/200',
  email: 'jordan@hooplink.com',
  settings: {
    notifications: true,
    publicProfile: true
  }
};

// Initialize some venues based on mock games
const INITIAL_VENUES: Record<string, Venue> = {
  'Rucker Park (Simulation)': {
    id: 'Rucker Park (Simulation)',
    name: 'Rucker Park (Simulation)',
    address: '155th St & Frederick Douglass Blvd',
    games: [MOCK_GAMES[0]],
    courts: [
      {
        id: 'c1',
        name: 'Main Court',
        format: '5v5',
        queue: [
           {
             id: 'team-1',
             name: 'Harlem All-Stars',
             players: [{ id: 'u-x', name: 'Marcus', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', email: '', settings: {notifications: false, publicProfile: true} }],
             timestamp: Date.now(),
             size: 5
           }
        ],
        currentMatch: {
          teamA: { id: 'team-a', name: 'The Kings', players: [], timestamp: 0, size: 5 },
          teamB: { id: 'team-b', name: 'Challengers', players: [], timestamp: 0, size: 5 },
          startTime: Date.now() - 600000
        }
      }
    ]
  }
};

// Mock initial channels based on games + a general one
const INITIAL_CHANNELS: ChatChannel[] = [
    {
        id: 'general',
        name: 'General Chat',
        type: 'general',
        privacy: 'public',
        adminIds: ['system'],
        participants: ['user-1', 'u2', 'u3'], // Ensure current user is in public chat participants for logic consistency
        messages: [
            { id: 'g1', userId: 'system', userName: 'System', text: 'Welcome to HoopLink! Find a game or talk trash here.', timestamp: Date.now() - 10000000 }
        ],
        lastMessageAt: Date.now() - 10000000
    }
];

// Helper to convert game chat messages to channel format for init
MOCK_GAMES.forEach(game => {
    const participantIds = game.participants.map((p: any) => p.userId);
    if (!participantIds.includes('user-1')) participantIds.push('user-1'); // Ensure active mock user is in

    INITIAL_CHANNELS.push({
        id: `channel-${game.id}`,
        name: `${game.venueName} Run`,
        type: 'game',
        privacy: 'public',
        adminIds: [],
        participants: participantIds,
        contextId: game.id,
        messages: game.chatMessages,
        lastMessageAt: game.chatMessages.length > 0 ? game.chatMessages[game.chatMessages.length - 1].timestamp : Date.now()
    });
});

function App() {
  // -- State --
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [games, setGames] = useState<Game[]>(MOCK_GAMES);
  
  // Venue State Management
  const [venues, setVenues] = useState<Record<string, Venue>>(INITIAL_VENUES);
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null);

  // Chat State Management
  const [channels, setChannels] = useState<ChatChannel[]>(INITIAL_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  const [modalData, setModalData] = useState<{isOpen: boolean, venueName?: string, address?: string}>({ isOpen: false });
  
  // Game Details Modal State
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // -- Derived State --
  const activeVenue = activeVenueId ? venues[activeVenueId] : null;
  const selectedGame = selectedGameId ? games.find(g => g.id === selectedGameId) : null;

  // -- Auth Actions --
  const handleLogin = (data: { email: string }) => {
    // Mock login logic
    const newUser = {
      ...MOCK_USER_TEMPLATE,
      name: data.email.split('@')[0], // Use email prefix as name for demo
      email: data.email
    };
    setUser(newUser);
    
    // Ensure user is in general channel
    setChannels(prev => prev.map(c => {
      if (c.id === 'general' && !c.participants.includes(newUser.id)) {
        return { ...c, participants: [...c.participants, newUser.id] };
      }
      return c;
    }));
    
    setCurrentView(AppView.HOME);
  };

  const handleSignup = (data: { name?: string, email: string }) => {
    // Mock signup logic
    const newUser = {
      id: `user-${Date.now()}`,
      name: data.name || 'Baller',
      email: data.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`, // Dynamic avatar
      settings: { notifications: true, publicProfile: true }
    };
    setUser(newUser);

    // Ensure user is in general channel
    setChannels(prev => prev.map(c => {
      if (c.id === 'general' && !c.participants.includes(newUser.id)) {
        return { ...c, participants: [...c.participants, newUser.id] };
      }
      return c;
    }));

    setCurrentView(AppView.HOME);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView(AppView.LANDING);
    setActiveChannelId(null);
    setActiveVenueId(null);
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...updates });
  };

  // -- Game Actions --
  const handleJoinGame = (gameId: string) => {
    if (!user) return;
    setGames(prev => prev.map(g => {
      if (g.id !== gameId) return g;
      const isJoined = g.participants.some(p => p.userId === user.id);
      if (isJoined) return g;
      return {
        ...g,
        participants: [...g.participants, { userId: user.id, status: 'confirmed' }]
      };
    }));
    
    // Join the chat channel for this game
    setChannels(prev => prev.map(c => {
        if (c.contextId === gameId && !c.participants.includes(user.id)) {
            return { ...c, participants: [...c.participants, user.id] };
        }
        return c;
    }));
  };

  const handleLeaveGame = (gameId: string) => {
    if (!user) return;
    setGames(prev => prev.map(g => {
      if (g.id !== gameId) return g;
      return {
        ...g,
        participants: g.participants.filter(p => p.userId !== user.id)
      };
    }));
    // Optional: Leave chat channel. For now, we keep them in so they can say goodbye or see history.
  };

  const handleCancelGame = (gameId: string) => {
      if (!user) return;
      setGames(prev => prev.map(g => {
          if (g.id !== gameId) return g;
          return { ...g, status: 'cancelled' };
      }));
      setSelectedGameId(null);
  };

  const handleRemovePlayer = (gameId: string, userId: string) => {
      if (!user) return;
      setGames(prev => prev.map(g => {
          if (g.id !== gameId) return g;
          return {
              ...g,
              participants: g.participants.filter(p => p.userId !== userId)
          };
      }));
  };

  const handleTogglePrivacy = (gameId: string) => {
      setGames(prev => prev.map(g => {
          if (g.id !== gameId) return g;
          return {
              ...g,
              privacy: g.privacy === 'public' ? 'invite-only' : 'public'
          };
      }));
  };

  const handleTransferHost = (gameId: string, newHostId: string) => {
      setGames(prev => prev.map(g => {
          if (g.id !== gameId) return g;
          return { ...g, hostId: newHostId };
      }));
  };

  const handleUpdateGame = (gameId: string, updates: Partial<Game>) => {
      setGames(prev => prev.map(g => {
          if (g.id !== gameId) return g;
          return { ...g, ...updates };
      }));
  };

  // -- Tournament Bracket Logic --

  const handleGenerateBracket = (gameId: string) => {
      setGames(prev => prev.map(g => {
          if (g.id !== gameId || !g.tournamentConfig) return g;

          const bracket: BracketMatch[] = [];
          const size = g.tournamentConfig.bracketSize;
          // Shuffle participants
          const shuffled = [...g.participants].sort(() => 0.5 - Math.random());

          // Create Round 1 Matches
          for (let i = 0; i < size / 2; i++) {
             bracket.push({
                 id: `r1-m${i}`,
                 round: 1,
                 matchIndex: i,
                 player1Id: shuffled[i * 2]?.userId,
                 player2Id: shuffled[i * 2 + 1]?.userId
             });
          }

          // Create Empty Subsequent Rounds
          let currentRound = 2;
          let matchCount = size / 4;
          while (matchCount >= 1) {
              for (let i = 0; i < matchCount; i++) {
                  bracket.push({
                      id: `r${currentRound}-m${i}`,
                      round: currentRound,
                      matchIndex: i
                  });
              }
              currentRound++;
              matchCount /= 2;
          }

          return { ...g, bracket };
      }));
  };

  const handleUpdateMatch = (gameId: string, matchId: string, score1: number, score2: number, winnerId: string) => {
      setGames(prev => prev.map(g => {
          if (g.id !== gameId || !g.bracket) return g;
          
          // 1. Find current match and set scores & winner
          const currentMatch = g.bracket.find(m => m.id === matchId);
          if (!currentMatch) return g;

          const updatedBracket = g.bracket.map(m => {
              if (m.id === matchId) return { ...m, score1, score2, winnerId };
              return m;
          });

          // 2. Find next match and populate player slot
          const nextRound = currentMatch.round + 1;
          const nextMatchIndex = Math.floor(currentMatch.matchIndex / 2);
          const playerSlot = currentMatch.matchIndex % 2 === 0 ? 'player1Id' : 'player2Id';

          const nextMatch = updatedBracket.find(m => m.round === nextRound && m.matchIndex === nextMatchIndex);
          
          if (nextMatch) {
              // Update next match
               const finalBracket = updatedBracket.map(m => {
                   if (m.id === nextMatch.id) {
                       return { ...m, [playerSlot]: winnerId };
                   }
                   return m;
               });
               return { ...g, bracket: finalBracket };
          }

          return { ...g, bracket: updatedBracket };
      }));
  };


  // -- Chat Actions --

  const handleSendMessage = (channelId: string, text: string) => {
    if (!user) return;
    
    const newMessage: Message = {
        id: `msg-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        text,
        timestamp: Date.now()
    };

    setChannels(prev => prev.map(c => {
        if (c.id !== channelId) return c;
        return {
            ...c,
            messages: [...c.messages, newMessage],
            lastMessageAt: newMessage.timestamp
        };
    }));
  };

  const handleCreateChannel = (name: string, type: 'general', privacy: 'public' | 'private') => {
      if (!user) return;
      const newChannel: ChatChannel = {
          id: `channel-gen-${Date.now()}`,
          name,
          type,
          privacy,
          adminIds: [user.id],
          participants: [user.id],
          messages: [],
          lastMessageAt: Date.now()
      };
      setChannels(prev => [newChannel, ...prev]);
      setActiveChannelId(newChannel.id);
  };

  const handleAddParticipant = (channelId: string, nameOrEmail: string) => {
      // Resolve if nameOrEmail is actually an ID from our mock DB
      const knownUser = MOCK_USERS.find(u => u.id === nameOrEmail);
      const participantId = knownUser ? knownUser.id : nameOrEmail;
      const displayName = knownUser ? knownUser.name : nameOrEmail;
      
      setChannels(prev => prev.map(c => {
          if (c.id !== channelId) return c;
          if (c.participants.includes(participantId)) return c;

          const systemMsg: Message = {
              id: `sys-${Date.now()}`,
              userId: 'system',
              userName: 'System',
              text: `${displayName} was added to the group.`,
              timestamp: Date.now()
          };

          return {
              ...c,
              participants: [...c.participants, participantId],
              messages: [...c.messages, systemMsg],
              lastMessageAt: Date.now()
          };
      }));
  };

  const handleOpenGameChat = (gameId: string) => {
      // Find existing channel for this game
      const existing = channels.find(c => c.contextId === gameId && c.type === 'game');
      if (existing) {
          setActiveChannelId(existing.id);
          setCurrentView(AppView.MESSAGES);
      } else {
          // Should usually exist if game exists, but fallback:
          const game = games.find(g => g.id === gameId);
          if(game && user) {
              const newChannel: ChatChannel = {
                  id: `channel-${game.id}`,
                  name: `${game.venueName} Run`,
                  type: 'game',
                  privacy: 'public',
                  adminIds: [],
                  participants: game.participants.map(p => p.userId),
                  contextId: game.id,
                  messages: [],
                  lastMessageAt: Date.now()
              };
              // Ensure creator is in
              if (!newChannel.participants.includes(user.id)) newChannel.participants.push(user.id);

              setChannels(prev => [newChannel, ...prev]);
              setActiveChannelId(newChannel.id);
              setCurrentView(AppView.MESSAGES);
          }
      }
  };

  const handleEnterVenueChat = (venueId: string, venueName: string) => {
      if (!user) return;
      
      // Check if channel exists for venue
      let channel = channels.find(c => c.contextId === venueId && c.type === 'venue');
      
      if (!channel) {
          // Create one
          const newChannel: ChatChannel = {
              id: `channel-venue-${venueId}`,
              name: `${venueName} Community`,
              type: 'venue',
              privacy: 'public',
              adminIds: [],
              participants: [user.id],
              contextId: venueId,
              messages: [{
                  id: 'sys-1',
                  userId: 'system',
                  userName: 'System',
                  text: `Welcome to the ${venueName} channel!`,
                  timestamp: Date.now()
              }],
              lastMessageAt: Date.now()
          };
          setChannels(prev => [newChannel, ...prev]);
          channel = newChannel;
      } else {
          // Add user if not in
          if (!channel.participants.includes(user.id)) {
              setChannels(prev => prev.map(c => {
                  if (c.id === channel!.id) return { ...c, participants: [...c.participants, user.id] };
                  return c;
              }));
          }
      }
      
      setActiveChannelId(channel.id);
      setCurrentView(AppView.MESSAGES);
  };


  const handleCreateGame = (gameData: Game) => {
    if (!user) return;
    
    // Common fields
    gameData.hostId = user.id;
    gameData.privacy = 'public';
    gameData.status = 'scheduled';

    // Standard Games: Auto-add creator
    // Tournaments: Creator must register manually (allows hosting without playing)
    if (gameData.type === 'standard') {
        gameData.participants.push({ userId: user.id, status: 'confirmed' });
    }

    setGames(prev => [gameData, ...prev]);
    
    // Create a chat channel for this game immediately
    const newChannel: ChatChannel = {
        id: `channel-${gameData.id}`,
        name: `${gameData.venueName} ${gameData.type === 'tournament' ? 'Tournament' : 'Run'}`,
        type: 'game',
        privacy: 'public',
        adminIds: [user.id],
        participants: [user.id],
        contextId: gameData.id,
        messages: [],
        lastMessageAt: Date.now()
    };
    setChannels(prev => [newChannel, ...prev]);

    // Also update the venue object to include this game
    const venueId = gameData.venueName;
    setVenues(prev => {
      const existing = prev[venueId] || { id: venueId, name: venueId, address: gameData.address, courts: [], games: [] };
      return {
        ...prev,
        [venueId]: {
          ...existing,
          games: [...existing.games, gameData]
        }
      };
    });

    setModalData({ isOpen: false });
    // Redirect to home
    setCurrentView(AppView.HOME);
  };

  const openCreateModal = (venueName: string, address?: string) => {
    setModalData({ isOpen: true, venueName, address });
  };

  // -- Venue & Queue Actions --
  
  const handleViewVenue = (venueName: string, address?: string) => {
    // Check if we have this venue in memory, if not, create a transient one
    if (!venues[venueName]) {
      setVenues(prev => ({
        ...prev,
        [venueName]: {
          id: venueName,
          name: venueName,
          address: address,
          courts: [],
          games: games.filter(g => g.venueName === venueName)
        }
      }));
    }
    setActiveVenueId(venueName);
    setCurrentView(AppView.VENUE_DETAILS);
  };

  const handleAddCourt = (venueId: string, courtName: string, format: Court['format']) => {
    setVenues(prev => {
      // If venue doesn't exist in state yet (it was transient), create it now
      const venue = prev[venueId] || { id: venueId, name: venueId, courts: [], games: [] };
      
      const newCourt: Court = {
        id: `court-${Date.now()}`,
        name: courtName,
        format,
        queue: []
      };

      return {
        ...prev,
        [venueId]: {
          ...venue,
          courts: [...venue.courts, newCourt]
        }
      };
    });
  };

  const handleJoinQueue = (venueId: string, courtId: string, teamSize: number) => {
    if (!user) return;
    
    setVenues(prev => {
      const venue = prev[venueId];
      if (!venue) return prev;

      const updatedCourts = venue.courts.map(court => {
        if (court.id !== courtId) return court;
        
        // Check if user is already in queue to prevent duplicates (simple check)
        const inQueue = court.queue.some(t => t.players.some(p => p.id === user.id));
        if (inQueue) return court;

        return {
          ...court,
          queue: [...court.queue, {
            id: `team-${Date.now()}`,
            name: user.name, // Assuming solo join for simplicity of UI
            players: [user],
            timestamp: Date.now(),
            size: teamSize
          }]
        };
      });

      return {
        ...prev,
        [venueId]: {
          ...venue,
          courts: updatedCourts
        }
      };
    });
  };

  // -- Views --

  if (!user) {
    if (currentView === AppView.LOGIN) {
      return (
        <AuthForm 
            type="LOGIN" 
            onSuccess={handleLogin} 
            onSwitch={() => setCurrentView(AppView.SIGNUP)}
            onBack={() => setCurrentView(AppView.LANDING)}
        />
      );
    }
    if (currentView === AppView.SIGNUP) {
      return (
        <AuthForm 
            type="SIGNUP" 
            onSuccess={handleSignup} 
            onSwitch={() => setCurrentView(AppView.LOGIN)}
            onBack={() => setCurrentView(AppView.LANDING)}
        />
      );
    }
    // Default to Landing
    return (
        <LandingPage 
            onLoginClick={() => setCurrentView(AppView.LOGIN)}
            onSignupClick={() => setCurrentView(AppView.SIGNUP)}
        />
    );
  }

  // -- Authenticated App Content --
  const renderHome = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="bg-gradient-to-r from-hoop-dark to-gray-800 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-hoop-orange rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
        <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}.</h1>
            <p className="text-gray-300 mb-6 max-w-xl">
                Ready to ball? Check out active runs near you or schedule your own.
            </p>
            <div className="flex gap-3">
                <Button 
                    variant="primary"
                    onClick={() => setCurrentView(AppView.MY_GAMES)}
                >
                    My Dashboard
                </Button>
            </div>
        </div>
      </section>

      {/* Search & Discovery */}
      <VenueSearch 
        onViewVenue={handleViewVenue} 
        games={games}
        onAddCourt={handleAddCourt}
        onJoinQueue={handleJoinQueue}
        user={user}
        venuesStore={venues}
        onScheduleGame={(venueName) => openCreateModal(venueName)}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 md:pb-0 flex flex-col">
      {/* Desktop Navbar */}
      <nav className="hidden md:flex bg-white border-b border-gray-100 px-6 py-4 justify-between items-center sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-hoop-orange cursor-pointer" onClick={() => setCurrentView(AppView.HOME)}>
                  <ICONS.Basketball width={28} height={28} />
                  <span className="text-xl font-black text-gray-900 tracking-tighter">HoopLink</span>
              </div>
              <div className="flex gap-1">
                  <button 
                    onClick={() => setCurrentView(AppView.HOME)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === AppView.HOME ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => setCurrentView(AppView.MESSAGES)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === AppView.MESSAGES ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Messages
                  </button>
                  <button 
                    onClick={() => setCurrentView(AppView.MY_GAMES)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === AppView.MY_GAMES ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    My Games
                  </button>
              </div>
          </div>
          <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors"
                onClick={() => setCurrentView(AppView.PROFILE)}
              >
                  <span className="text-sm font-bold text-gray-700">{user.name}</span>
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  </div>
              </div>
          </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {currentView === AppView.HOME && renderHome()}
        
        {currentView === AppView.VENUE_DETAILS && activeVenue && (
            <VenueDetails 
                venue={activeVenue} 
                currentUser={user}
                onAddCourt={handleAddCourt}
                onJoinQueue={handleJoinQueue}
                onBack={() => setCurrentView(AppView.HOME)}
                onEnterVenueChat={handleEnterVenueChat}
                onScheduleGame={(venueName) => openCreateModal(venueName, activeVenue.address)}
            />
        )}

        {currentView === AppView.MESSAGES && (
            <MessagesPage 
                channels={channels}
                currentUser={user}
                activeChannelId={activeChannelId}
                onSelectChannel={setActiveChannelId}
                onSendMessage={handleSendMessage}
                onCreateChannel={handleCreateChannel}
                onAddParticipant={handleAddParticipant}
            />
        )}

        {currentView === AppView.PROFILE && (
            <ProfilePage 
                user={user} 
                onUpdateUser={handleUpdateUser}
                onLogout={handleLogout}
            />
        )}

        {currentView === AppView.MY_GAMES && (
            <MyGamesPage 
                games={games}
                currentUser={user}
                onOpenGame={setSelectedGameId}
                onOpenChat={handleOpenGameChat}
            />
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => setCurrentView(AppView.HOME)}
            className={`flex flex-col items-center gap-1 ${currentView === AppView.HOME ? 'text-hoop-orange' : 'text-gray-400'}`}
          >
              <ICONS.MapPin width={24} height={24} />
              <span className="text-[10px] font-bold">Explore</span>
          </button>
          <button 
            onClick={() => setCurrentView(AppView.MY_GAMES)}
            className={`flex flex-col items-center gap-1 ${currentView === AppView.MY_GAMES ? 'text-hoop-orange' : 'text-gray-400'}`}
          >
              <ICONS.Basketball width={24} height={24} />
              <span className="text-[10px] font-bold">Games</span>
          </button>
          <button 
            onClick={() => setCurrentView(AppView.MESSAGES)}
            className={`flex flex-col items-center gap-1 ${currentView === AppView.MESSAGES ? 'text-hoop-orange' : 'text-gray-400'}`}
          >
              <ICONS.MessageSquare width={24} height={24} />
              <span className="text-[10px] font-bold">Chat</span>
          </button>
          <button 
            onClick={() => setCurrentView(AppView.PROFILE)}
            className={`flex flex-col items-center gap-1 ${currentView === AppView.PROFILE ? 'text-hoop-orange' : 'text-gray-400'}`}
          >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-current">
                  <img src={user.avatar} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-bold">Profile</span>
          </button>
      </div>

      {/* Global Modals */}
      {modalData.isOpen && modalData.venueName && (
        <CreateGameModal 
            venueName={modalData.venueName}
            address={modalData.address}
            onClose={() => setModalData({ isOpen: false })}
            onSubmit={handleCreateGame}
        />
      )}

      {selectedGameId && selectedGame && (
        <GameDetailsModal 
            game={selectedGame}
            currentUser={user}
            onClose={() => setSelectedGameId(null)}
            onJoin={handleJoinGame}
            onLeave={handleLeaveGame}
            onCancelGame={handleCancelGame}
            onRemovePlayer={handleRemovePlayer}
            onTogglePrivacy={handleTogglePrivacy}
            onTransferHost={handleTransferHost}
            onGenerateBracket={handleGenerateBracket}
            onUpdateMatch={handleUpdateMatch}
            onUpdateGame={handleUpdateGame}
        />
      )}
    </div>
  );
}

export default App;
