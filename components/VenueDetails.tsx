
import React, { useState } from 'react';
import { Venue, Court, User, QueueTeam, ParsedVenueMetadata } from '../types';
import { Button } from './Button';
import { ICONS } from '../constants';

interface VenueDetailsProps {
  venue: Venue;
  currentUser: User;
  onAddCourt: (venueId: string, courtName: string, format: Court['format']) => void;
  onJoinQueue: (venueId: string, courtId: string, teamSize: number) => void;
  onBack?: () => void;
  onEnterVenueChat?: (venueId: string, venueName: string) => void;
  onScheduleGame?: (venueName: string) => void;
  isEmbedded?: boolean;
  meta?: ParsedVenueMetadata; // Passed from search results for rich info
}

export const VenueDetails: React.FC<VenueDetailsProps> = ({ 
  venue, 
  currentUser, 
  onAddCourt, 
  onJoinQueue, 
  onBack,
  onEnterVenueChat,
  onScheduleGame,
  isEmbedded = false,
  meta
}) => {
  const [showAddCourt, setShowAddCourt] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtFormat, setNewCourtFormat] = useState<Court['format']>('3v3');

  const handleAddCourtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCourtName.trim()) {
      onAddCourt(venue.id, newCourtName, newCourtFormat);
      setShowAddCourt(false);
      setNewCourtName('');
    }
  };

  const renderQueueVisual = (queue: QueueTeam[]) => {
    if (queue.length === 0) {
      return <div className="text-sm text-gray-400 italic py-2">Queue is empty. You got next!</div>;
    }

    return (
      <div className="space-y-2 mt-2">
        {queue.map((team, idx) => (
          <div key={team.id} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
            <div className="font-bold text-gray-400 w-6 text-center">{idx + 1}</div>
            <div className="flex -space-x-2">
              {team.players.map((p, i) => (
                <img 
                  key={i} 
                  src={p.avatar} 
                  alt={p.name} 
                  className="w-8 h-8 rounded-full border-2 border-white" 
                  title={p.name}
                />
              ))}
            </div>
            <div className="flex-1">
               <div className="text-sm font-bold text-gray-800">{team.name}</div>
               <div className="text-xs text-gray-500">{team.size} Player{team.size > 1 ? 's' : ''}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 ${isEmbedded ? 'pt-4 border-t border-gray-100 mt-4' : ''}`}>
      {/* Header - Only show if NOT embedded */}
      {!isEmbedded && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="mb-4">
              <ICONS.ChevronLeft width={16} /> Back
            </Button>
          )}
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
                <h1 className="text-3xl font-black text-gray-900 mb-1">{venue.name}</h1>
                <div className="flex items-center gap-2 text-gray-500">
                    <ICONS.MapPin width={18} />
                    <span>{venue.address || 'Local Court'}</span>
                </div>
            </div>
            
            <div className="flex gap-2">
                {onScheduleGame && (
                    <Button onClick={() => onScheduleGame(venue.name)} variant="primary">
                        <ICONS.CalendarPlus width={18} height={18} /> Schedule Run
                    </Button>
                )}
                {onEnterVenueChat && (
                    <Button onClick={() => onEnterVenueChat(venue.id, venue.name)} variant="secondary">
                        <ICONS.MessageSquare /> Chat Room
                    </Button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Meta Suitability Grid (Intel) */}
      {meta && (
          <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Surface</span>
                  <span className="font-bold text-gray-800 text-sm">{meta.surface || 'Unknown'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Lighting</span>
                  <span className={`font-bold text-sm ${meta.lighting ? 'text-green-600' : 'text-red-500'}`}>
                      {meta.lighting ? 'Available' : 'None'}
                  </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Access</span>
                  <span className="font-bold text-gray-800 text-sm">{meta.access || 'Public'}</span>
              </div>
          </div>
      )}
      
      {/* Embedded view specific chat button */}
      {isEmbedded && (
          <div className="flex gap-2 mb-4">
              {onScheduleGame && (
                  <Button onClick={() => onScheduleGame(venue.name)} fullWidth variant="primary">
                    <ICONS.CalendarPlus width={18} height={18} /> Schedule Run
                  </Button>
              )}
              {onEnterVenueChat && (
                  <Button onClick={() => onEnterVenueChat(venue.id, venue.name)} fullWidth variant="secondary">
                      <ICONS.MessageSquare /> Enter Venue Chat
                  </Button>
              )}
          </div>
      )}

      {/* Active Courts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Courts & Queues
          </h2>
          <Button onClick={() => setShowAddCourt(true)} size="sm" variant="outline">
            <ICONS.Plus width={16} /> Add Court
          </Button>
        </div>

        {/* Add Court Form */}
        {showAddCourt && (
          <div className="bg-white p-4 rounded-xl shadow-md border border-hoop-orange mb-6 animate-in zoom-in duration-200">
            <h3 className="font-bold text-gray-800 mb-3">Add New Court</h3>
            <form onSubmit={handleAddCourtSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Court Name</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="e.g. Main Court, Half Court 2"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hoop-orange outline-none"
                  value={newCourtName}
                  onChange={(e) => setNewCourtName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Format</label>
                <div className="flex gap-2 flex-wrap">
                  {['1v1', '2v2', '3v3', '4v4', '5v5', 'Shootaround'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setNewCourtFormat(fmt as any)}
                      className={`px-3 py-1 rounded-md text-sm border transition-colors ${newCourtFormat === fmt ? 'bg-hoop-dark text-white border-hoop-dark' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddCourt(false)} fullWidth>Cancel</Button>
                <Button type="submit" fullWidth>Create Court</Button>
              </div>
            </form>
          </div>
        )}

        <div className={`grid grid-cols-1 ${isEmbedded ? 'lg:grid-cols-2' : 'md:grid-cols-2'} gap-4`}>
          {venue.courts.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
              <ICONS.Basketball className="mx-auto mb-2 opacity-20" width={32} height={32} />
              <p className="text-sm">No courts set up yet.</p>
              <button onClick={() => setShowAddCourt(true)} className="text-hoop-orange text-sm font-bold hover:underline mt-1">
                Add the first court
              </button>
            </div>
          ) : (
            venue.courts.map(court => (
              <div key={court.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg