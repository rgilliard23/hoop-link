
import React, { useState, useEffect, useRef } from 'react';
import { findLocalVenues, VenueSearchResponse } from '../services/geminiService';
import { Button } from './Button';
import { ICONS, MAJOR_CITIES } from '../constants';
import { GroundingChunk, Game } from '../types';
import { VenueDetails } from './VenueDetails';
import { VenueMap } from './VenueMap';

interface VenueSearchProps {
  onViewVenue: (venueName: string, address?: string) => void; 
  games: Game[];
  // Added optional props for embedded functionality
  onAddCourt?: any; 
  onJoinQueue?: any;
  user?: any;
  venuesStore?: any;
  onScheduleGame?: (venueName: string) => void;
}

type ViewMode = 'list' | 'map';
type SortOption = 'relevance' | 'openSpots' | 'nextGame';

export const VenueSearch: React.FC<VenueSearchProps> = ({ 
    onViewVenue, 
    games, 
    onAddCourt, 
    onJoinQueue, 
    user, 
    venuesStore,
    onScheduleGame
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VenueSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Autocomplete state
  const [manualQuery, setManualQuery] = useState('');
  const [radius, setRadius] = useState<number>(5);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLFormElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showMobileList, setShowMobileList] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  
  // State for map center
  const [currentGps, setCurrentGps] = useState<{lat: number, lng: number} | null>(null);

  // Inline Expansion State
  const [expandedVenueId, setExpandedVenueId] = useState<string | null>(null);

  // Handle clicking outside autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualQuery(val);
    
    if (val.length > 1) {
      const filtered = MAJOR_CITIES.filter(city => 
        city.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (city: string) => {
    setManualQuery(city);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleGpsSearch = () => {
    setLoading(true);
    setError(null);
    setData(null);
    setExpandedVenueId(null);
    setShowMobileList(false);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentGps({ lat, lng });
        
        const result = await findLocalVenues({ 
            lat, 
            lng,
            radius: radius
        });
        setData(result);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Access denied or unavailable. Please check permissions or try manual search.");
        setLoading(false);
      }
    );
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);
    setExpandedVenueId(null);
    setShowMobileList(false);
    setCurrentGps(null); // Reset GPS since we are searching manually
    setShowSuggestions(false);

    const result = await findLocalVenues({ 
        query: manualQuery,
        radius: radius
    });
    setData(result);
    setLoading(false);
  };

  const toggleExpand = (venueName: string) => {
      if (expandedVenueId === venueName) {
          setExpandedVenueId(null);
      } else {
          setExpandedVenueId(venueName);
      }
  };

  // When clicking on Map marker or list item
  const handleVenueSelection = (venueName: string) => {
      setExpandedVenueId(venueName);
      // Close mobile list if open so we see the map + card
      setShowMobileList(false);
      
      // In Desktop mode, scroll list to item
      setTimeout(() => {
          const element = document.getElementById(`venue-card-${venueName}`);
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }, 100);
  };

  // Helper for consistent game matching used in both sorting and rendering
  const getRelevantGames = (venueTitle: string | undefined) => {
      if (!venueTitle) return [];
      return games.filter(g => 
          g.status !== 'cancelled' &&
          (g.venueName.toLowerCase().includes(venueTitle.toLowerCase()) || 
           venueTitle.toLowerCase().includes(g.venueName.toLowerCase()))
      );
  };

  // --- Sorting Logic ---
  const getSortedChunks = () => {
    if (!data?.chunks) return [];
    const chunks = [...data.chunks];

    if (sortBy === 'relevance') return chunks;

    return chunks.sort((a, b) => {
        const nameA = a.maps?.title || '';
        const nameB = b.maps?.title || '';
        
        const gamesA = getRelevantGames(nameA);
        const gamesB = getRelevantGames(nameB);

        if (sortBy === 'openSpots') {
            const spotsA = gamesA.reduce((sum, g) => sum + (g.maxPlayers - g.participants.length), 0);
            const spotsB = gamesB.reduce((sum, g) => sum + (g.maxPlayers - g.participants.length), 0);
            return spotsB - spotsA; // Descending (More spots first)
        }

        if (sortBy === 'nextGame') {
            const getNextTime = (gameList: Game[]) => {
                if (gameList.length === 0) return Infinity;
                const times = gameList.map(g => new Date(`${g.date}T${g.startTime}`).getTime());
                return Math.min(...times);
            };

            const timeA = getNextTime(gamesA);
            const timeB = getNextTime(gamesB);
            return timeA - timeB; // Ascending (Sooner first)
        }

        return 0;
    });
  };

  const sortedChunks = getSortedChunks();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ICONS.MapPin /> Find Courts
            </h2>
            <p className="text-gray-500">
              Search by location to find courts, see live queues, and schedule games.
            </p>
          </div>
          
          {/* View Toggle */}
          {data && (
            <div className="flex items-center gap-3 self-start">
                 {/* Sort Dropdown */}
                 {viewMode === 'list' && (
                     <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="h-9 text-sm bg-gray-50 border border-gray-200 rounded-lg px-2 outline-none focus:border-hoop-orange cursor-pointer"
                     >
                         <option value="relevance">Sort: Relevance</option>
                         <option value="openSpots">Sort: Most Open Spots</option>
                         <option value="nextGame">Sort: Next Game Time</option>
                     </select>
                 )}

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-hoop-dark' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ICONS.List width={16} height={16} /> List
                    </button>
                    <button 
                        onClick={() => setViewMode('map')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-hoop-dark' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ICONS.Map width={16} height={16} /> Map
                    </button>
                </div>
            </div>
          )}
        </div>

        {/* Search Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            <Button 
                onClick={handleGpsSearch} 
                disabled={loading}
                className="flex-none whitespace-nowrap"
            >
                <ICONS.MapPin width={18} height={18} />
                Near Me
            </Button>
            
            <div className="hidden md:flex items-center justify-center text-gray-400 font-medium text-sm uppercase px-2">
                Or
            </div>

            <form onSubmit={handleManualSearch} className="flex-1 flex flex-col sm:flex-row gap-2 relative" ref={autocompleteRef}>
                {/* Radius Selector */}
                <select 
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="h-10 sm:h-auto border border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-hoop-orange focus:border-transparent outline-none bg-white text-sm font-medium text-gray-700 cursor-pointer"
                >
                    <option value="1">1 mi</option>
                    <option value="5">5 mi</option>
                    <option value="10">10 mi</option>
                    <option value="25">25 mi</option>
                    <option value="50">50 mi</option>
                </select>

                <div className="flex-1 relative">
                  <input 
                      type="text" 
                      placeholder="Enter city, zip, or address..." 
                      className="w-full h-10 sm:h-auto border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-hoop-orange focus:border-transparent outline-none transition-all"
                      value={manualQuery}
                      onChange={handleQueryChange}
                      onFocus={() => manualQuery.length > 1 && setShowSuggestions(true)}
                  />
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white mt-1 border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map((city, idx) => (
                        <li 
                          key={idx}
                          onClick={() => selectSuggestion(city)}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 text-sm border-b border-gray-50 last:border-none"
                        >
                          {city}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button type="submit" variant="secondary" disabled={loading || !manualQuery.trim()} className="h-10 sm:h-auto">
                    Search
                </Button>
            </form>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hoop-orange"></div>
            <p className="text-gray-400 animate-pulse">Scouting the area & checking vibes...</p>
          </div>
        ) : data ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {viewMode === 'list' ? (
              <div className="grid grid-cols-1 gap-4">
                {sortedChunks.map((chunk: GroundingChunk, idx: number) => {
                  if (!chunk.maps?.title) return null;
                  return (
                     <VenueCard 
                        key={idx} 
                        chunk={chunk} 
                        isExpanded={expandedVenueId === chunk.maps.title} 
                        onToggle={() => toggleExpand(chunk.maps!.title!)}
                        games={games}
                        metadata={data.parsedMetadata}
                        venuesStore={venuesStore}
                        user={user}
                        onAddCourt={onAddCourt}
                        onJoinQueue={onJoinQueue}
                        onScheduleGame={onScheduleGame}
                     />
                  );
                })}
              </div>
            ) : (
              <div className="relative h-[600px] md:h-[700px] w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                 {/* MAP LAYER - Absolute, z-0 */}
                 <div className="absolute inset-0 z-0">
                    <VenueMap 
                        venues={data.chunks}
                        metadata={data.parsedMetadata}
                        selectedVenueId={expandedVenueId}
                        onSelectVenue={handleVenueSelection}
                        center={currentGps}
                        radiusMiles={radius}
                        manualQuery={manualQuery}
                    />
                 </div>

                 {/* DESKTOP SIDEBAR - Absolute left, z-10, hidden on mobile */}
                 <div className="hidden md:flex flex-col absolute top-4 left-4 bottom-4 w-1/3 max-w-sm bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl z-10 border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <span className="font-bold text-gray-700">Results ({data.chunks.filter(c => c.maps?.title).length})</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300">
                        {sortedChunks.map((chunk: GroundingChunk, idx: number) => {
                            if (!chunk.maps?.title) return null;
                            return (
                                <VenueCard 
                                    key={idx} 
                                    chunk={chunk} 
                                    isExpanded={expandedVenueId === chunk.maps.title} 
                                    onToggle={() => toggleExpand(chunk.maps!.title!)}
                                    games={games}
                                    metadata={data.parsedMetadata}
                                    venuesStore={venuesStore}
                                    user={user}
                                    onAddCourt={onAddCourt}
                                    onJoinQueue={onJoinQueue}
                                    onScheduleGame={onScheduleGame}
                                    compact={true}
                                />
                            );
                        })}
                    </div>
                 </div>

                 {/* MOBILE: Bottom Sheet for Selected Venue */}
                 {expandedVenueId && (
                     <div className="md:hidden absolute bottom-0 left-0 right-0 z-20 p-4 flex justify-center pointer-events-none">
                         <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-10 duration-300 border border-gray-200 max-h-[85vh] overflow-y-auto flex flex-col relative">
                              {/* Drag Handle / Close */}
                              <div className="sticky top-0 right-0 flex justify-end p-2 bg-gradient-to-b from-white to-transparent z-10">
                                  <button 
                                    onClick={() => setExpandedVenueId(null)}
                                    className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 text-gray-500 shadow-sm transition-colors"
                                    aria-label="Close Details"
                                  >
                                     <ICONS.Plus className="rotate-45 w-5 h-5" />
                                  </button>
                              </div>
                              
                              <div className="px-2 pb-2 -mt-8"> {/* Negative margin to pull content up into header space */}
                                {(() => {
                                    const chunk = data.chunks.find((c: any) => c.maps?.title === expandedVenueId);
                                    if (!chunk) return null;
                                    return (
                                        <VenueCard 
                                            chunk={chunk} 
                                            isExpanded={true} 
                                            onToggle={() => setExpandedVenueId(null)}
                                            games={games}
                                            metadata={data.parsedMetadata}
                                            venuesStore={venuesStore}
                                            user={user}
                                            onAddCourt={onAddCourt}
                                            onJoinQueue={onJoinQueue}
                                            onScheduleGame={onScheduleGame}
                                            compact={false} // Full details in overlay
                                        />
                                    );
                                })()}
                              </div>
                         </div>
                     </div>
                 )}

                 {/* MOBILE: Floating "List" Button (Only if no venue selected) */}
                 {!expandedVenueId && (
                     <div className="md:hidden absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                         <Button onClick={() => setShowMobileList(true)} className="shadow-xl rounded-full px-6">
                             <ICONS.List className="mr-2" /> View List
                         </Button>
                     </div>
                 )}

                 {/* MOBILE: Full Screen List Overlay */}
                 {showMobileList && (
                    <div className="md:hidden absolute inset-0 z-30 bg-gray-50 flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="p-4 bg-white shadow-sm flex justify-between items-center z-10 border-b border-gray-200">
                            <h3 className="font-bold text-lg">Found Courts</h3>
                            <Button variant="secondary" size="sm" onClick={() => setShowMobileList(false)}>
                                Close
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {sortedChunks.map((chunk: GroundingChunk, idx: number) => {
                                if (!chunk.maps?.title) return null;
                                return (
                                    <div key={idx} onClick={() => {
                                        setExpandedVenueId(chunk.maps!.title!);
                                        setShowMobileList(false); // Close list and show map + card
                                    }}>
                                        <VenueCard 
                                            chunk={chunk} 
                                            isExpanded={false} 
                                            onToggle={() => {}} // No-op here, parent click handles it
                                            games={games}
                                            metadata={data.parsedMetadata}
                                            venuesStore={venuesStore}
                                            user={user}
                                            onAddCourt={onAddCourt}
                                            onJoinQueue={onJoinQueue}
                                            onScheduleGame={onScheduleGame}
                                            compact={true}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 )}
              </div>
            )}
            
            {data.chunks.length === 0 && (
                 <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                     No specific map locations returned. Try a different search term or radius.
                 </div>
            )}
          </div>
        ) : (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Start a search above to find local courts.
            </div>
        )}
      </div>
    </div>
  );
};

// Helper subcomponent for rendering the venue card to avoid duplication
const VenueCard = ({ chunk, isExpanded, onToggle, games, metadata, venuesStore, user, onAddCourt, onJoinQueue, compact, onScheduleGame }: any) => {
    const venueName = chunk.maps.title;
    
    // Helper to count games with robust matching
    const relevantGames = games.filter((g: any) => 
        g.status !== 'cancelled' &&
        (g.venueName.toLowerCase().includes(venueName.toLowerCase()) || 
        venueName.toLowerCase().includes(g.venueName.toLowerCase()))
    );
    const activeGames = relevantGames.length;
    const totalSpots = relevantGames.reduce((sum: number, g: any) => sum + (g.maxPlayers - g.participants.length), 0);

    // Helper to find next upcoming game
    let nextGame = null;
    if (relevantGames.length > 0) {
        const sortedGames = [...relevantGames].sort((a: any, b: any) => {
            const timeA = new Date(`${a.date}T${a.startTime}`).getTime();
            const timeB = new Date(`${b.date}T${b.startTime}`).getTime();
            return timeA - timeB;
        });
        // Only show if in future (simplified check)
        nextGame = sortedGames[0];
    }

    // Helper to get metadata
    const meta = metadata ? (metadata[venueName.toLowerCase()] || Object.values(metadata).find((m: any) => venueName.toLowerCase().includes(m.name))) : null;
    // Fallback metadata search in parsed list
    const displayMeta = meta || (metadata ? Object.entries(metadata).find(([k, v]) => venueName.toLowerCase().includes(k))?.[1] : null);

    return (
        <div 
            id={`venue-card-${venueName}`}
            className={`border transition-all duration-300 bg-white rounded-xl overflow-hidden ${isExpanded && !compact ? 'ring-0 border-transparent' : 'border-gray-200 hover:shadow-md'} ${isExpanded && compact ? 'ring-2 ring-hoop-orange shadow-lg' : ''}`}
        >
          <div className="p-4 flex flex-col gap-2 cursor-pointer" onClick={compact ? onToggle : undefined}>
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h3 className="font-bold text-lg text-gray-800 leading-tight">{venueName}</h3>
                    
                    <div className="flex flex-wrap gap-2">
                        {displayMeta?.type && displayMeta.type !== 'Unknown' && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                                displayMeta.type === 'Indoor' 
                                ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                : 'bg-green-50 text-green-700 border-green-100'
                            }`}>
                                {displayMeta.type}
                            </span>
                        )}
                        
                        {/* Suitability Badges */}
                        {displayMeta?.lighting && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-yellow-50 text-yellow-700 border-yellow-100 flex items-center gap-1">
                                <span>💡</span> Lights
                            </span>
                        )}
                        
                        {displayMeta?.surface && displayMeta.surface !== 'Unknown' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                                {displayMeta.surface}
                            </span>
                        )}

                        {activeGames > 0 && (
                            <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-orange-200">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                                {activeGames} Run{activeGames !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
                
                {displayMeta?.rating && (
                    <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100 shrink-0">
                        <span className="text-yellow-500 text-xs">★</span>
                        <span className="font-bold text-xs text-gray-800">{displayMeta.rating}</span>
                    </div>
                )}
            </div>

            {/* Quick details for next game */}
            {!compact && nextGame && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                        <ICONS.Calendar width={14} />
                        <span className="font-medium">Next: <span className="text-gray-900">{nextGame.date}</span> @ <span className="text-gray-900">{nextGame.startTime}</span></span>
                    </div>
                    <span className="text-hoop-orange font-bold uppercase text-[10px]">{nextGame.level}</span>
                </div>
            )}

            {!compact && displayMeta?.desc && (
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mt-1">
                    {displayMeta.desc}
                </p>
            )}

            {/* Compact mode next game line */}
            {compact && nextGame && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                    <ICONS.Calendar width={10} />
                    <span>Next run: {nextGame.date} {nextGame.startTime}</span>
                </div>
            )}
            
            <div className={`flex items-center gap-4 mt-2 pt-2 border-t border-gray-50 ${compact ? 'hidden' : ''}`}>
                 {chunk.maps.uri && (
                    <a 
                    href={chunk.maps.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                    >
                        <ICONS.MapPin width={14} /> Map
                    </a>
                )}
                
                <Button 
                    variant={isExpanded ? "secondary" : "primary"}
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className="ml-auto"
                >
                    {isExpanded ? 'Close' : 'Details'}
                </Button>
            </div>
          </div>

          {/* Embedded Details View */}
          {isExpanded && (
              <div className="bg-gray-50 p-3 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
                  {venuesStore && venuesStore[venueName] ? (
                      <VenueDetails 
                        venue={venuesStore[venueName]} 
                        currentUser={user}
                        onAddCourt={onAddCourt}
                        onJoinQueue={onJoinQueue}
                        onScheduleGame={onScheduleGame}
                        isEmbedded={true}
                        meta={displayMeta}
                      />
                  ) : (
                      // Transient view if not in store yet, passing defaults
                      <VenueDetails 
                        venue={{
                            id: venueName, 
                            name: venueName, 
                            address: chunk.maps.title || '', 
                            courts: [], 
                            games: games.filter((g: any) => g.venueName === venueName)
                        }}
                        currentUser={user}
                        onAddCourt={onAddCourt}
                        onJoinQueue={onJoinQueue}
                        onScheduleGame={onScheduleGame}
                        isEmbedded={true}
                        meta={displayMeta}
                      />
                  )}
              </div>
          )}
        </div>
    );
};
