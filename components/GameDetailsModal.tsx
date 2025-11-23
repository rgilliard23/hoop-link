
import React, { useState } from 'react';
import { Game, User, BracketMatch } from '../types';
import { Button } from './Button';
import { ICONS, MOCK_USERS } from '../constants';
import { TournamentBracket } from './TournamentBracket';

interface GameDetailsModalProps {
  game: Game;
  currentUser: User;
  onClose: () => void;
  onJoin: (gameId: string) => void;
  onLeave: (gameId: string) => void;
  onCancelGame: (gameId: string) => void;
  onRemovePlayer: (gameId: string, userId: string) => void;
  onTogglePrivacy: (gameId: string) => void;
  onTransferHost: (gameId: string, userId: string) => void;
  // New Props
  onGenerateBracket?: (gameId: string) => void;
  onUpdateMatch?: (gameId: string, matchId: string, score1: number, score2: number, winnerId: string) => void;
  onUpdateGame?: (gameId: string, updates: Partial<Game>) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  currentUser,
  onClose,
  onJoin,
  onLeave,
  onCancelGame,
  onRemovePlayer,
  onTogglePrivacy,
  onTransferHost,
  onGenerateBracket,
  onUpdateMatch,
  onUpdateGame
}) => {
  const isHost = game.hostId === currentUser.id;
  const isJoined = game.participants.some(p => p.userId === currentUser.id);
  const spotsLeft = game.maxPlayers - game.participants.length;

  // State for UI modes
  const [isTransferringHost, setIsTransferringHost] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    type: 'CANCEL' | 'KICK' | 'PRIVACY' | 'LEAVE' | 'TRANSFER' | 'WINNER' | 'PAYMENT';
    title: string;
    message: string;
    data?: any;
  } | null>(null);

  // State for Score Input
  const [scoreInput, setScoreInput] = useState({ s1: '', s2: '', winner: '' });

  // State for Editing Tournament
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editConfig, setEditConfig] = useState({ 
      size: game.tournamentConfig?.bracketSize || 8, 
      fee: game.tournamentConfig?.entryFee || 0 
  });
  
  // State for Payment Simulation
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Helper to resolve user details
  const getParticipantDetails = (userId: string) => {
      if (userId === currentUser.id) return currentUser;
      return MOCK_USERS.find(u => u.id === userId) || { name: 'Guest User', avatar: '', id: userId } as User;
  };

  // --- Action Handlers ---

  const handleKickClick = (userId: string) => {
    const user = getParticipantDetails(userId);
    setConfirmation({
        type: 'KICK',
        title: `Kick ${user.name}?`,
        message: `Are you sure you want to remove ${user.name} from this run?`,
        data: { userId }
    });
  };

  const handleCancelClick = () => {
    setConfirmation({
        type: 'CANCEL',
        title: "Cancel Game?",
        message: "This will remove the game for all participants. This action cannot be undone.",
    });
  };

  const handlePrivacyClick = () => {
    const newStatus = game.privacy === 'public' ? 'Invite Only' : 'Public';
    setConfirmation({
        type: 'PRIVACY',
        title: `Make ${newStatus}?`,
        message: `Changing the game to ${newStatus} will update visibility for all users.`,
    });
  };

  const handleLeaveClick = () => {
    if (isHost && game.participants.length > 1) {
        setIsTransferringHost(true);
    } else if (isHost) {
         setConfirmation({
            type: 'CANCEL',
            title: "End Game?",
            message: "You are the last player. Leaving will cancel the game.",
         });
    } else {
         setConfirmation({
            type: 'LEAVE',
            title: "Leave Game?",
            message: "Are you sure you want to drop out of this run?",
         });
    }
  };

  const handleHostSelect = (userId: string) => {
      const user = getParticipantDetails(userId);
      setConfirmation({
          type: 'TRANSFER',
          title: `Make ${user.name} Host?`,
          message: `You are assigning host privileges to ${user.name}.`,
          data: { userId }
      });
  };
  
  // Handle Join with Payment Check
  const handleJoinClick = () => {
      // If tournament and has fee, show payment modal
      if (game.type === 'tournament' && game.tournamentConfig?.entryFee && game.tournamentConfig.entryFee > 0) {
          setConfirmation({
              type: 'PAYMENT',
              title: 'Registration Fee',
              message: `Entry fee is $${game.tournamentConfig.entryFee}.`,
              data: { amount: game.tournamentConfig.entryFee }
          });
      } else {
          onJoin(game.id);
      }
  };

  const handlePaymentSuccess = () => {
      setIsProcessingPayment(true);
      setTimeout(() => {
          setIsProcessingPayment(false);
          setConfirmation(null);
          onJoin(game.id);
      }, 1500);
  };

  // Tournament Handlers
  const handleMatchClick = (matchId: string) => {
      if (!game.bracket) return;
      const match = game.bracket.find(m => m.id === matchId);
      if (!match || !match.player1Id || !match.player2Id) return;

      // Initialize inputs
      setScoreInput({ s1: '', s2: '', winner: '' });

      // Show winner selection
      setConfirmation({
          type: 'WINNER',
          title: 'Update Match Score',
          message: 'Enter final scores to advance the bracket.',
          data: { match }
      });
  };

  const handleScoreSubmit = () => {
      if (confirmation?.data?.match && onUpdateMatch) {
          const match = confirmation.data.match as BracketMatch;
          const s1 = parseInt(scoreInput.s1) || 0;
          const s2 = parseInt(scoreInput.s2) || 0;
          
          let winnerId = scoreInput.winner;
          // Auto-determine winner if not selected but scores differ
          if (!winnerId) {
             if (s1 > s2) winnerId = match.player1Id!;
             if (s2 > s1) winnerId = match.player2Id!;
          }

          if (winnerId) {
            onUpdateMatch(game.id, match.id, s1, s2, winnerId);
            setConfirmation(null);
          }
      }
  };

  const handleSaveConfig = () => {
    if (onUpdateGame && game.tournamentConfig) {
       onUpdateGame(game.id, {
           maxPlayers: editConfig.size,
           tournamentConfig: {
               ...game.tournamentConfig,
               bracketSize: editConfig.size as 4 | 8 | 16 | 32,
               entryFee: editConfig.fee,
               prizePool: `$${editConfig.fee * editConfig.size}`
           }
       });
       setIsEditingConfig(false);
    }
  };

  const confirmAction = () => {
    if (!confirmation) return;

    switch (confirmation.type) {
        case 'KICK':
            onRemovePlayer(game.id, confirmation.data.userId);
            break;
        case 'CANCEL':
            onCancelGame(game.id);
            onClose();
            break;
        case 'PRIVACY':
            onTogglePrivacy(game.id);
            break;
        case 'LEAVE':
            onLeave(game.id);
            onClose();
            break;
        case 'TRANSFER':
            onTransferHost(game.id, confirmation.data.userId);
            setIsTransferringHost(false);
            break;
    }
    setConfirmation(null);
  };

  // --- Render Sub-Views ---

  const renderHostTransfer = () => (
      <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4">
              <button onClick={() => setIsTransferringHost(false)} className="text-sm text-gray-500 hover:text-hoop-orange flex items-center gap-1 mb-2">
                  <ICONS.ChevronLeft width={16} /> Back to Roster
              </button>
              <h3 className="font-bold text-lg text-gray-900">Select New Host</h3>
              <p className="text-xs text-gray-500">Choose a player to take over the game.</p>
          </div>
          <div className="space-y-2">
              {game.participants.filter(p => p.userId !== currentUser.id).map(p => {
                  const user = getParticipantDetails(p.userId);
                  return (
                      <div 
                        key={p.userId} 
                        onClick={() => handleHostSelect(p.userId)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-hoop-orange hover:bg-orange-50 cursor-pointer transition-all"
                      >
                          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                             {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : null}
                          </div>
                          <div className="font-bold text-gray-800">{user.name}</div>
                      </div>
                  );
              })}
          </div>
      </div>
  );

  const renderConfirmation = () => {
      if (!confirmation) return null;

      // Payment Confirmation
      if (confirmation.type === 'PAYMENT') {
          return (
              <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 border border-green-100">
                      <span className="font-black text-2xl">$</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Secure Payment</h3>
                  <p className="text-gray-500 mb-6">Total: <span className="font-bold text-gray-900">${confirmation.data.amount}</span></p>
                  
                  {/* Fake Card Form */}
                  <div className="w-full max-w-xs bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 space-y-3 text-left">
                      <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Card Number</label>
                          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-2">
                              <ICONS.Lock width={12} className="text-gray-400"/>
                              <input type="text" value="•••• •••• •••• 4242" disabled className="bg-transparent w-full text-sm font-mono outline-none text-gray-600"/>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Expiry</label>
                            <input type="text" value="12/25" disabled className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm outline-none text-gray-600"/>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">CVC</label>
                            <input type="text" value="•••" disabled className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm outline-none text-gray-600"/>
                        </div>
                      </div>
                  </div>

                  <div className="flex gap-3 w-full max-w-xs">
                      <Button variant="outline" fullWidth onClick={() => setConfirmation(null)} disabled={isProcessingPayment}>Cancel</Button>
                      <Button fullWidth onClick={handlePaymentSuccess} disabled={isProcessingPayment}>
                          {isProcessingPayment ? 'Processing...' : `Pay $${confirmation.data.amount}`}
                      </Button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-4 flex items-center gap-1">
                      <ICONS.Lock width={10} /> Encrypted & Secure via Stripe (Simulated)
                  </p>
              </div>
          );
      }

      // Special render for Winner Selection
      if (confirmation.type === 'WINNER') {
          const match = confirmation.data.match as BracketMatch;
          const p1 = getParticipantDetails(match.player1Id!);
          const p2 = getParticipantDetails(match.player2Id!);

          return (
            <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Match Result</h3>
                
                <div className="w-full max-w-sm space-y-4">
                    {/* Player 1 Input */}
                    <div 
                        onClick={() => setScoreInput({...scoreInput, winner: p1.id})}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${scoreInput.winner === p1.id ? 'border-hoop-orange bg-orange-50 ring-1 ring-hoop-orange' : 'border-gray-200 bg-white'}`}
                    >
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                <img src={p1.avatar} className="w-full h-full object-cover" />
                             </div>
                             <div className="font-bold text-gray-800 text-left">
                                 <div>{p1.name}</div>
                                 {scoreInput.winner === p1.id && <div className="text-[10px] text-hoop-orange font-bold uppercase">Winner</div>}
                             </div>
                        </div>
                        <input 
                            type="number" 
                            placeholder="0"
                            className="w-16 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:border-hoop-orange outline-none"
                            value={scoreInput.s1}
                            onChange={(e) => setScoreInput({...scoreInput, s1: e.target.value})}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="text-gray-400 font-bold text-sm">VS</div>

                    {/* Player 2 Input */}
                    <div 
                        onClick={() => setScoreInput({...scoreInput, winner: p2.id})}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${scoreInput.winner === p2.id ? 'border-hoop-orange bg-orange-50 ring-1 ring-hoop-orange' : 'border-gray-200 bg-white'}`}
                    >
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                <img src={p2.avatar} className="w-full h-full object-cover" />
                             </div>
                             <div className="font-bold text-gray-800 text-left">
                                 <div>{p2.name}</div>
                                 {scoreInput.winner === p2.id && <div className="text-[10px] text-hoop-orange font-bold uppercase">Winner</div>}
                             </div>
                        </div>
                        <input 
                            type="number" 
                            placeholder="0"
                            className="w-16 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:border-hoop-orange outline-none"
                            value={scoreInput.s2}
                            onChange={(e) => setScoreInput({...scoreInput, s2: e.target.value})}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-8 w-full max-w-sm">
                    <Button variant="outline" fullWidth onClick={() => setConfirmation(null)}>Cancel</Button>
                    <Button 
                        fullWidth 
                        onClick={handleScoreSubmit}
                        disabled={!scoreInput.winner && (!scoreInput.s1 || !scoreInput.s2 || scoreInput.s1 === scoreInput.s2)}
                    >
                        End Match
                    </Button>
                </div>
            </div>
          );
      }

      return (
          <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-hoop-dark">
                  {confirmation.type === 'CANCEL' || confirmation.type === 'KICK' ? <ICONS.X width={32} height={32} /> : <ICONS.Info width={32} height={32} />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmation.title}</h3>
              <p className="text-gray-500 mb-8">{confirmation.message}</p>
              
              <div className="flex gap-3 w-full">
                  <Button variant="outline" fullWidth onClick={() => setConfirmation(null)}>Cancel</Button>
                  <Button 
                    variant={confirmation.type === 'CANCEL' || confirmation.type === 'KICK' ? 'danger' : 'primary'} 
                    fullWidth 
                    onClick={confirmAction}
                  >
                      Confirm
                  </Button>
              </div>
          </div>
      );
  };

  const isTournament = game.type === 'tournament';
  const bracketExists = game.bracket && game.bracket.length > 0;
  const registrationPercent = (game.participants.length / game.maxPlayers) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] relative">
        
        {/* Header */}
        <div className="bg-hoop-dark p-4 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
                {isTournament && <ICONS.Trophy className="text-yellow-400" />}
                <h3 className="text-lg font-bold">{game.venueName} {isTournament ? 'Tournament' : 'Run'}</h3>
            </div>
            <p className="text-xs text-gray-400">{game.date} @ {game.startTime}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <ICONS.X />
          </button>
        </div>

        {/* Main Content */}
        {isTransferringHost ? renderHostTransfer() : (
            <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4">
                
                {/* Tournament Info & Registration Bar */}
                {isTournament && (
                    <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200 transition-all">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase">Registration</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-900">{game.participants.length} / {game.maxPlayers} Teams</span>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                            <div 
                                className="bg-hoop-orange h-3 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(registrationPercent, 100)}%` }}
                            ></div>
                        </div>

                        {isEditingConfig ? (
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4 animate-in fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bracket Size</label>
                                        <select 
                                            value={editConfig.size}
                                            onChange={(e) => setEditConfig({...editConfig, size: Number(e.target.value) as any})}
                                            className="w-full border-gray-300 rounded px-2 py-1 text-sm"
                                        >
                                            <option value={4}>4 Teams</option>
                                            <option value={8}>8 Teams</option>
                                            <option value={16}>16 Teams</option>
                                            <option value={32}>32 Teams</option>
                                        </select>
                                        {editConfig.size < game.participants.length && (
                                            <p className="text-xs text-red-500 mt-1">Smaller than current roster!</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Entry Fee ($)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={editConfig.fee}
                                            onChange={(e) => setEditConfig({...editConfig, fee: Number(e.target.value)})}
                                            className="w-full border-gray-300 rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button size="sm" variant="outline" onClick={() => setIsEditingConfig(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleSaveConfig} disabled={editConfig.size < game.participants.length}>Save Changes</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-end text-xs text-gray-500 border-t border-gray-200 pt-3">
                                <div className="space-x-4">
                                    <span>Format: <span className="font-bold text-gray-800">{game.tournamentConfig?.bracketSize} Team {game.tournamentConfig?.bracketSize === 16 ? 'KO' : 'Bracket'}</span></span>
                                    <span>Entry: <span className="font-bold text-gray-800">${game.tournamentConfig?.entryFee}</span></span>
                                    <span>Prize: <span className="font-bold text-green-600">{game.tournamentConfig?.prizePool}</span></span>
                                </div>
                                
                                {isHost && !bracketExists && (
                                    <button 
                                        onClick={() => setIsEditingConfig(true)}
                                        className="text-hoop-orange hover:text-orange-700 font-bold flex items-center gap-1 transition-colors"
                                    >
                                        Edit Settings
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Generate Button for Host */}
                        {isHost && !bracketExists && game.participants.length === game.maxPlayers && !isEditingConfig && (
                            <div className="mt-4">
                                <Button fullWidth variant="primary" onClick={() => onGenerateBracket && onGenerateBracket(game.id)}>
                                    Generate Bracket
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* The Bracket View */}
                {isTournament && bracketExists ? (
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Bracket</h4>
                        <TournamentBracket 
                            matches={game.bracket || []} 
                            participants={game.participants}
                            isHost={isHost}
                            onMatchClick={handleMatchClick}
                        />
                    </div>
                ) : (
                    /* Normal Roster View (Or Registration List for Tourney) */
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                            {isTournament ? 'Registered Teams' : 'Roster'}
                        </h4>
                        <div className="space-y-2">
                            {game.participants.map((p) => {
                                const isMe = p.userId === currentUser.id;
                                const userDetails = getParticipantDetails(p.userId);
                                const isHostUser = p.userId === game.hostId;

                                return (
                                    <div key={p.userId} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                                                {userDetails.avatar ? <img src={userDetails.avatar} alt={userDetails.name} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-xs font-bold text-gray-500">{userDetails.name.charAt(0)}</div>}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                    {userDetails.name}
                                                    {isHostUser && <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 rounded">HOST</span>}
                                                    {isMe && <span className="text-[10px] text-gray-400">(You)</span>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* In Tournament, removal is sensitive, maybe only allow before bracket gen? For now, allow always */}
                                        {isHost && !isHostUser && !bracketExists && (
                                            <button 
                                                onClick={() => handleKickClick(p.userId)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                                title="Remove Player"
                                            >
                                                <ICONS.X width={16} height={16} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {/* Empty Slots */}
                            {!bracketExists && Array.from({ length: Math.max(0, spotsLeft) }).map((_, i) => (
                                <div key={`empty-${i}`} className="flex items-center gap-3 p-2 opacity-50">
                                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                                        <span className="text-gray-300 text-xs">+</span>
                                    </div>
                                    <div className="text-sm text-gray-400 italic">Open Spot</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Host Controls (Non-Tournament Specifics) */}
                {isHost && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-bold text-gray-700">Settings</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={handlePrivacyClick}
                                className={`text-xs py-2 px-3 rounded border flex items-center justify-center gap-2 transition-colors ${game.privacy === 'invite-only' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                                <ICONS.Lock width={14} />
                                {game.privacy === 'invite-only' ? 'Make Public' : 'Make Invite Only'}
                            </button>
                            <button 
                                onClick={handleCancelClick}
                                className="text-xs py-2 px-3 rounded border border-red-100 text-red-600 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-2"
                            >
                                <ICONS.Trash width={14} /> Cancel Game
                            </button>
                            {game.participants.length > 1 && (
                                <button 
                                    onClick={() => setIsTransferringHost(true)}
                                    className="col-span-2 text-xs py-2 px-3 rounded border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 flex items-center justify-center gap-2"
                                >
                                    <ICONS.UserPlus width={14} /> Transfer Host
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 z-10">
                {isJoined ? (
                    <Button variant="outline" fullWidth onClick={handleLeaveClick} disabled={isTournament && bracketExists}>
                        {isTournament && bracketExists ? 'Tournament In Progress' : 'Leave Game'}
                    </Button>
                ) : (
                    <Button 
                        variant="primary" 
                        fullWidth 
                        onClick={handleJoinClick} 
                        disabled={spotsLeft <= 0 || game.privacy === 'invite-only'}
                    >
                        {game.privacy === 'invite-only' ? 'Invite Only' : (
                            spotsLeft > 0 ? (
                                isTournament ? `Register Team ${game.tournamentConfig?.entryFee ? `($${game.tournamentConfig.entryFee})` : ''}` : 'Join Run'
                            ) : 'Full'
                        )}
                    </Button>
                )}
            </div>

            </div>
        )}

        {/* Overlay for Confirmation */}
        {renderConfirmation()}

      </div>
    </div>
  );
};
