'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface PropertyMapProps {
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  propertyName?: string;
  className?: string;
}

export default function PropertyMap({ address, propertyName, className = '' }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullAddress = [
    address.street,
    address.city,
    address.state,
    address.zip,
  ].filter(Boolean).join(', ');

  useEffect(() => {
    if (!fullAddress) {
      setError('No address provided');
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Map configuration pending');
      return;
    }

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => setError('Failed to load map');
      document.head.appendChild(script);
    };

    const initMap = async () => {
      if (!mapRef.current || !window.google?.maps) return;

      try {
        const geocoder = new window.google.maps.Geocoder();
        
        geocoder.geocode({ address: fullAddress }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const location = results[0].geometry.location;
            
            const map = new window.google.maps.Map(mapRef.current!, {
              center: location,
              zoom: 15,
              styles: [
                {
                  featureType: 'all',
                  elementType: 'geometry',
                  stylers: [{ color: '#242f3e' }],
                },
                {
                  featureType: 'all',
                  elementType: 'labels.text.stroke',
                  stylers: [{ color: '#242f3e' }],
                },
                {
                  featureType: 'all',
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#746855' }],
                },
                {
                  featureType: 'road',
                  elementType: 'geometry',
                  stylers: [{ color: '#38414e' }],
                },
                {
                  featureType: 'road',
                  elementType: 'geometry.stroke',
                  stylers: [{ color: '#212a37' }],
                },
                {
                  featureType: 'road',
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#9ca5b3' }],
                },
                {
                  featureType: 'water',
                  elementType: 'geometry',
                  stylers: [{ color: '#17263c' }],
                },
              ],
              disableDefaultUI: true,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: true,
              fullscreenControl: true,
            });

            new window.google.maps.Marker({
              position: location,
              map,
              title: propertyName || 'Property Location',
              animation: window.google.maps.Animation.DROP,
            });

            setIsLoaded(true);
          } else {
            setError('Could not find location');
          }
        });
      } catch (err) {
        setError('Failed to initialize map');
      }
    };

    loadGoogleMaps();
  }, [fullAddress, propertyName]);

  // Fallback to static map embed if no API key
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && fullAddress) {
    const encodedAddress = encodeURIComponent(fullAddress);
    return (
      <div className={`relative rounded-xl overflow-hidden border border-white/10 ${className}`}>
        <iframe
          src={`https://www.google.com/maps?q=${encodedAddress}&output=embed`}
          width="100%"
          height="100%"
          style={{ border: 0, minHeight: '300px' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map of ${propertyName || 'property'}`}
        />
      </div>
    );
  }

  if (error) {
    // Show a static map link as fallback
    const encodedAddress = encodeURIComponent(fullAddress);
    return (
      <div className={`relative rounded-xl overflow-hidden border border-white/10 bg-slate-900/60 ${className}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <MapPin className="h-12 w-12 text-violet-400 mb-3" />
          <p className="text-white font-medium mb-2">{propertyName || 'Property Location'}</p>
          <p className="text-sm text-slate-300 mb-4">{fullAddress}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            View on Google Maps
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-white/10 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-300">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
}

// Type declaration for Google Maps
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: any) => any;
        Geocoder: new () => {
          geocode: (
            request: { address: string },
            callback: (results: any[] | null, status: string) => void
          ) => void;
        };
        Marker: new (options: any) => any;
        Animation: {
          DROP: number;
          BOUNCE: number;
        };
      };
    };
  }
}
