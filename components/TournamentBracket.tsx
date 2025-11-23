
import React from 'react';
import { BracketMatch } from '../types';
import { MOCK_USERS } from '../constants';

interface TournamentBracketProps {
    matches: BracketMatch[];
    participants: any[];
    isHost: boolean;
    onMatchClick: (matchId: string) => void;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({ matches, participants, isHost, onMatchClick }) => {
    // Helper to get user name
    const getName = (id?: string) => {
        if (!id) return 'TBD';
        const p = participants.find(p => p.userId === id);
        if (p) {
            const u = MOCK_USERS.find(u => u.id === id);
            return u ? u.name : 'Player';
        }
        return 'Unknown';
    };

    // Group matches by round
    const rounds: Record<number, BracketMatch[]> = {};
    matches.forEach(m => {
        if (!rounds[m.round]) rounds[m.round] = [];
        rounds[m.round].push(m);
    });
    // Sort within round
    Object.keys(rounds).forEach(r => {
        rounds[Number(r)].sort((a, b) => a.matchIndex - b.matchIndex);
    });

    const roundKeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);

    return (
        <div className="flex gap-12 overflow-x-auto p-6 min-h-[400px] items-center justify-start md:justify-center bg-gray-50 rounded-xl border border-gray-200">
            {roundKeys.map((roundNum, rIdx) => (
                <div key={roundNum} className="flex flex-col justify-around gap-8 min-w-[180px] relative h-full">
                    <h4 className="text-center text-xs font-bold text-gray-400 uppercase mb-2 absolute -top-8 w-full tracking-widest">
                        {roundNum === roundKeys.length ? 'Finals' : (roundNum === roundKeys.length - 1 ? 'Semis' : `Round ${roundNum}`)}
                    </h4>
                    
                    {rounds[roundNum].map((match, mIdx) => (
                        <div key={match.id} className="relative flex flex-col justify-center my-2">
                            
                            {/* The Match Box */}
                            <div 
                                onClick={() => isHost && match.player1Id && match.player2Id && !match.winnerId ? onMatchClick(match.id) : null}
                                className={`bg-white border rounded-lg shadow-sm overflow-hidden w-44 flex flex-col relative z-10 transition-all
                                    ${isHost && match.player1Id && match.player2Id && !match.winnerId ? 'cursor-pointer hover:ring-2 hover:ring-hoop-orange hover:border-hoop-orange shadow-md' : ''}
                                    ${match.winnerId ? 'border-gray-300' : 'border-gray-200'}
                                `}
                            >
                                <div className={`flex justify-between items-center px-3 py-2 border-b border-gray-100 ${match.winnerId === match.player1Id ? 'bg-green-50 text-green-800 font-bold' : 'text-gray-700'}`}>
                                    <span className="truncate text-xs font-medium">{getName(match.player1Id)}</span>
                                    <span className="text-xs font-mono font-bold">{match.score1 ?? '-'}</span>
                                </div>
                                <div className={`flex justify-between items-center px-3 py-2 ${match.winnerId === match.player2Id ? 'bg-green-50 text-green-800 font-bold' : 'text-gray-700'}`}>
                                    <span className="truncate text-xs font-medium">{getName(match.player2Id)}</span>
                                    <span className="text-xs font-mono font-bold">{match.score2 ?? '-'}</span>
                                </div>
                            </div>

                            {/* Connecting Lines */}
                            {rIdx < roundKeys.length - 1 && (
                                <>
                                    {/* Horizontal Line out */}
                                    <div className="absolute top-1/2 -right-6 w-6 h-0.5 bg-gray-300"></div>
                                    
                                    {/* Vertical Line Connector - Only on even indices, connects to the odd index below it */}
                                    {mIdx % 2 === 0 && (
                                        <div className="absolute top-1/2 -right-6 w-0.5 h-[calc(100%+2rem)] bg-gray-300 origin-top transform translate-y-0"></div>
                                    )}
                                </>
                            )}
                             {rIdx > 0 && (
                                <>
                                    {/* Horizontal Line In */}
                                    <div className="absolute top-1/2 -left-6 w-6 h-0.5 bg-gray-300"></div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
