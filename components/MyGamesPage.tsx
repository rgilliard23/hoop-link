
import React, { useState } from 'react';
import { Game, User } from '../types';
import { ICONS } from '../constants';
import { Button } from './Button';

interface MyGamesPageProps {
  games: Game[];
  currentUser: User;
  onOpenGame: (gameId: string) => void;
  onOpenChat: (gameId: string) => void;
}

export const MyGamesPage: React.FC<MyGamesPageProps> = ({ games, currentUser, onOpenGame, onOpenChat }) => {
    const [activeTab, setActiveTab] = useState<'hosted' | 'playing'>('hosted');

    // Filter games
    const hostedGames = games.filter(g => g.hostId === currentUser.id && g.status !== 'cancelled');
    const playingGames = games.filter(g => 
        g.hostId !== currentUser.id && 
        g.participants.some(p => p.userId === currentUser.id) &&
        g.status !== 'cancelled'
    );

    const displayGames = activeTab === 'hosted' ? hostedGames : playingGames;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Games</h2>
                
                <div className="flex gap-2 border-b border-gray-100 pb-1 mb-6">
                    <button 
                        onClick={() => setActiveTab('hosted')}
                        className={`px-4 py-2 font-bold text-sm transition-colors relative ${activeTab === 'hosted' ? 'text-hoop-orange' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        Hosting ({hostedGames.length})
                        {activeTab === 'hosted' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-hoop-orange rounded-full"></div>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('playing')}
                        className={`px-4 py-2 font-bold text-sm transition-colors relative ${activeTab === 'playing' ? 'text-hoop-orange' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        Playing ({playingGames.length})
                        {activeTab === 'playing' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-hoop-orange rounded-full"></div>}
                    </button>
                </div>

                <div className="space-y-4">
                    {displayGames.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <div className="w-12 h-12 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                                <ICONS.Basketball width={24} height={24} />
                            </div>
                            <p>No games found.</p>
                            {activeTab === 'hosted' ? (
                                <p className="text-xs">Schedule a run to see it here!</p>
                            ) : (
                                <p className="text-xs">Join a run from the home page.</p>
                            )}
                        </div>
                    ) : (
                        displayGames.map(game => (
                            <div key={game.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0 ${game.type === 'tournament' ? 'bg-hoop-dark' : 'bg-hoop-orange'}`}>
                                            {game.type === 'tournament' ? <ICONS.Trophy width={20} /> : <ICONS.Basketball width={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{game.venueName}</h3>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                <span className="flex items-center gap-1"><ICONS.Calendar width={14} /> {game.date}</span>
                                                <span className="flex items-center gap-1"><ICONS.Info width={14} /> {game.startTime}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="hidden md:block text-right mr-4">
                                            <div className="text-sm font-bold text-gray-800">
                                                {game.participants.length} / {game.maxPlayers}
                                            </div>
                                            <div className="text-xs text-gray-400 uppercase">Players</div>
                                        </div>
                                        
                                        <Button variant="outline" size="sm" onClick={() => onOpenChat(game.id)}>
                                            <ICONS.MessageSquare width={16} />
                                        </Button>
                                        <Button variant={activeTab === 'hosted' ? "secondary" : "primary"} size="sm" onClick={() => onOpenGame(game.id)}>
                                            {activeTab === 'hosted' ? 'Manage' : 'Details'}
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* Status Bar */}
                                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full font-bold ${game.type === 'tournament' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                                            {game.type === 'tournament' ? 'Tournament' : game.level}
                                        </span>
                                        {game.privacy === 'invite-only' && <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Private</span>}
                                    </div>
                                    
                                    {game.type === 'tournament' && game.bracket && game.bracket.length > 0 && (
                                        <span className="text-green-600 font-bold flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Live Bracket
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
