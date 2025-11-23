
import React, { useState } from 'react';
import { Button } from './Button';
import { generateGameDescription } from '../services/geminiService';
import { ICONS } from '../constants';

interface CreateGameModalProps {
  venueName: string;
  address?: string;
  onClose: () => void;
  onSubmit: (gameData: any) => void;
}

type GameType = 'standard' | 'tournament';

export const CreateGameModal: React.FC<CreateGameModalProps> = ({ venueName, address, onClose, onSubmit }) => {
  const [gameType, setGameType] = useState<GameType>('standard');
  
  // Shared State
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [level, setLevel] = useState('All Levels');
  const [isGenerating, setIsGenerating] = useState(false);

  // Standard State
  const [maxPlayers, setMaxPlayers] = useState(10);

  // Tournament State
  const [bracketSize, setBracketSize] = useState<4 | 8 | 16 | 32>(8);
  const [entryFee, setEntryFee] = useState(0);
  const [tourneyFormat, setTourneyFormat] = useState('1v1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    await generateGameDescription(venueName, level, time);

    const newGame: any = {
      id: `game-${Date.now()}`,
      venueName,
      address: address || 'Local Court',
      startTime: time,
      date,
      participants: [],
      level,
      chatMessages: [],
      type: gameType
    };

    if (gameType === 'standard') {
      newGame.maxPlayers = maxPlayers;
    } else {
      newGame.maxPlayers = bracketSize; // Assuming 1 player/team per slot for simplicity of this demo
      newGame.tournamentConfig = {
        bracketSize,
        entryFee,
        format: tourneyFormat,
        prizePool: entryFee > 0 ? `$${entryFee * bracketSize}` : 'Bragging Rights'
      };
      newGame.bracket = []; // Init empty
    }
    
    onSubmit(newGame);
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Mode Selector Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2">
            <button
                type="button"
                onClick={() => setGameType('standard')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${gameType === 'standard' ? 'bg-white shadow-sm text-hoop-orange ring-1 ring-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                <ICONS.Basketball width={16} /> Pickup Run
            </button>
            <button
                type="button"
                onClick={() => setGameType('tournament')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${gameType === 'tournament' ? 'bg-white shadow-sm text-hoop-orange ring-1 ring-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                <ICONS.Trophy width={16} /> Tournament
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                type="date" 
                required
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-hoop-orange focus:ring-hoop-orange"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input 
                    type="time" 
                    required
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-hoop-orange focus:ring-hoop-orange"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                />
             </div>
          </div>

          {gameType === 'standard' ? (
              /* STANDARD MODE INPUTS */
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Players</label>
                <div className="flex items-center gap-2">
                    <button 
                        type="button" 
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 font-bold"
                        onClick={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
                    >
                        -
                    </button>
                    <input 
                        type="number" 
                        className="w-full text-center border-gray-300 rounded-lg shadow-sm"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    />
                    <button 
                        type="button" 
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 font-bold"
                        onClick={() => setMaxPlayers(Math.min(100, maxPlayers + 1))}
                    >
                        +
                    </button>
                </div>
              </div>
          ) : (
              /* TOURNAMENT MODE INPUTS */
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Format</label>
                          <select 
                             value={tourneyFormat}
                             onChange={(e) => setTourneyFormat(e.target.value)}
                             className="w-full border-gray-300 rounded-lg shadow-sm text-sm"
                          >
                              <option value="1v1">1v1</option>
                              <option value="3v3">3v3</option>
                              <option value="5v5">5v5</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bracket Size</label>
                          <select 
                             value={bracketSize}
                             onChange={(e) => setBracketSize(Number(e.target.value) as any)}
                             className="w-full border-gray-300 rounded-lg shadow-sm text-sm"
                          >
                              <option value={4}>4 Teams</option>
                              <option value={8}>8 Teams</option>
                              <option value={16}>16 Teams</option>
                              <option value={32}>32 Teams</option>
                          </select>
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Entry Fee ($)</label>
                      <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input 
                              type="number" 
                              min="0"
                              placeholder="0"
                              value={entryFee}
                              onChange={(e) => setEntryFee(Number(e.target.value))}
                              className="w-full pl-7 border-gray-300 rounded-lg shadow-sm focus:border-hoop-orange focus:ring-hoop-orange"
                          />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">Total Prize Pool: <span className="font-bold text-hoop-orange">${entryFee * bracketSize}</span></p>
                  </div>
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Competition Level</label>
            <div className="flex gap-2">
              {['Casual', 'All Levels', 'Competitive'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${level === l ? 'bg-hoop-dark text-white border-hoop-dark' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" fullWidth onClick={onClose}>Cancel</Button>
            <Button type="submit" fullWidth disabled={isGenerating}>
              {isGenerating ? 'Scheduling...' : (gameType === 'tournament' ? 'Create Tournament' : 'Schedule Run')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};