import React, { useEffect, useRef, useState } from 'react';
import { GroundingChunk, ParsedVenueMetadata } from '../types';
import { Button } from './Button';
import { ICONS } from '../constants';

interface VenueMapProps {
  venues: GroundingChunk[];
  metadata?: Record<string, ParsedVenueMetadata>;
  selectedVenueId: string | null;
  onSelectVenue: (venueId: string) => void;
  center: { lat: number; lng: number } | null;
  radiusMiles: number;
  manualQuery?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const loadGoogleMaps = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject());
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

export const VenueMap: React.FC<VenueMapProps> = ({ 
  venues, 
  metadata, 
  selectedVenueId, 
  onSelectVenue, 
  center,
  radiusMiles
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef = useRef<any>(null);
  
  const [apiKey, setApiKey] = useState<string>(() => {
      return process.env.GOOGLE_MAPS_API_KEY || localStorage.getItem('google_maps_api_key') || '';
  });
  const [tempKey, setTempKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load Script
  useEffect(() => {
    if (!apiKey) return;

    setError(null);
    
    loadGoogleMaps(apiKey)
      .then(() => {
          setLoaded(true);
          localStorage.setItem('google_maps_api_key', apiKey);
      })
      .catch((e) => {
          console.error(e);
          setError("Failed to load Google Maps script. The key might be invalid or network blocked.");
          setLoaded(false);
      });
  }, [apiKey]);

  // Draw Map
  useEffect(() => {
    if (!loaded || !mapRef.current || !window.google) return;
    const google = window.google;

    if (!mapInstance.current) {
      const defaultCenter = { lat: 37.7749, lng: -122.4194 };

      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "poi.park",
            elementType: "labels",
            stylers: [{ visibility: "on" }]
          }
        ]
      });
    }

    const map = mapInstance.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Clear existing circle
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    // 1. Draw Radius Circle
    if (center) {
        const radiusMeters = radiusMiles * 1609.34;
        circleRef.current = new google.maps.Circle({
            strokeColor: "#FF5722",
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: "#FF5722",
            fillOpacity: 0.08,
            map,
            center: center,
            radius: radiusMeters,
            clickable: false
        });

        // If this is a new search (no venues displayed yet), center on the user/search location
        if (venues.length === 0) {
          map.panTo(center);
          map.setZoom(13);
        }
    }

    const bounds = new google.maps.LatLngBounds();
    if (center) bounds.extend(center);
    
    let hasMarkers = false;

    // 2. Draw Venue Markers
    venues.forEach(venue => {
        const name = venue.maps?.title;
        if (!name) return;
        
        // Find metadata
        let meta = metadata ? (metadata[name.toLowerCase()] || Object.values(metadata).find((m: any) => name.toLowerCase().includes(m.name?.toLowerCase()))) : undefined;
        if (!meta && metadata) {
             const key = Object.keys(metadata).find(k => name.toLowerCase().includes(k) || k.includes(name.toLowerCase()));
             if (key) meta = metadata[key];
        }

        if (meta && meta.lat && meta.lng) {
            const position = { lat: meta.lat, lng: meta.lng };
            const isSelected = selectedVenueId === name;

            // Custom Pin SVG
            const pinColor = isSelected ? "#FF5722" : "#2D2D2D";
            const scale = isSelected ? 1.3 : 1;

            const marker = new google.maps.Marker({
                position,
                map,
                title: name,
                zIndex: isSelected ? 1000 : 1,
                icon: {
                  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                  fillColor: pinColor,
                  fillOpacity: 1,
                  strokeWeight: 1.5,
                  strokeColor: "#FFFFFF",
                  scale: 1.5 * scale,
                  anchor: new google.maps.Point(12, 24),
                },
            });

            marker.addListener("click", () => {
                onSelectVenue(name);
            });

            markersRef.current.push(marker);
            bounds.extend(position);
            hasMarkers = true;

            if (isSelected) {
                map.panTo(position);
                map.setZoom(15);
            }
        }
    });

    // Fit bounds only if we have markers and the user hasn't just clicked one
    if (hasMarkers && !selectedVenueId) {
        map.fitBounds(bounds, 50); 
    }

  }, [venues, metadata, selectedVenueId, center, radiusMiles, loaded]);

  const handleKeySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (tempKey.trim()) {
          setApiKey(tempKey.trim());
      }
  };

  const handleResetKey = () => {
      setApiKey('');
      setTempKey('');
      localStorage.removeItem('google_maps_api_key');
      setError(null);
      setLoaded(false);
  };

  if (!apiKey) {
      return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 p-6 text-center relative">
               <div className="max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200 z-10">
                   <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                       <ICONS.Map width={24} height={24} />
                   </div>
                   <h3 className="font-bold text-gray-900 text-lg mb-2">Enable Google Maps</h3>
                   <p className="text-sm text-gray-500 mb-6">
                       To view the interactive map, please provide a valid Google Maps JavaScript API Key.
                       <br/>
                       <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noopener noreferrer" className="text-hoop-orange hover:underline text-xs mt-2 inline-block">
                           Get an API Key &rarr;
                       </a>
                   </p>

                   <form onSubmit={handleKeySubmit} className="space-y-3">
                       <input
                           type="text"
                           value={tempKey}
                           onChange={(e) => setTempKey(e.target.value)}
                           placeholder="Paste API Key here..."
                           className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-hoop-orange focus:border-transparent outline-none"
                       />
                       <Button type="submit" fullWidth disabled={!tempKey.trim()}>
                           Load Map
                       </Button>
                   </form>
                   <p className="text-xs text-gray-400 mt-4">
                       This key is stored locally in your browser for this session.
                   </p>
               </div>
               <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
          </div>
      );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 p-6 text-center">
        <div className="max-w-sm">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <p className="font-bold text-gray-800 mb-1">Map Error</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button onClick={handleResetKey} variant="outline" size="sm">
                Enter Different Key
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative shadow-inner border border-gray-200 bg-gray-100">
        <div ref={mapRef} className="w-full h-full" />
        {!loaded && !error && (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 z-10">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hoop-orange"></div>
             </div>
        )}
        {/* Reset Button (Subtle, bottom right) */}
        <button 
            onClick={handleResetKey}
            className="absolute bottom-1 left-1 z-10 text-[10px] text-gray-400 hover:text-gray-600 bg-white/80 px-2 py-1 rounded backdrop-blur-sm"
            title="Reset Map API Key"
        >
            Reset Key
        </button>
    </div>
  );
};