import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';
import { branches } from '../data/branches';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
}

interface BranchesMapProps {
  branches: Branch[];
}

export function BranchesMap({ branches }: BranchesMapProps) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
  };

  const center = {
    lat:  6.68278,
    lng: 80.39917
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={8.5}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          styles: [
            {
              elementType: 'geometry',
              stylers: [{ color: '#242f3e' }]
            },
            {
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#242f3e' }]
            },
            {
              elementType: 'labels.text.fill',
              stylers: [{ color: '#746855' }]
            },
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#d59563' }]
            },
            {
              featureType: 'poi',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#d59563' }]
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry',
              stylers: [{ color: '#263c3f' }]
            },
            {
              featureType: 'poi.park',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#6b9080' }]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#38414e' }]
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#212a37' }]
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#9ca5b3' }]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{ color: '#746855' }]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#1f2835' }]
            },
            {
              featureType: 'road.highway',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#f3751ff' }]
            },
            {
              featureType: 'transit',
              elementType: 'geometry',
              stylers: [{ color: '#2f3948' }]
            },
            {
              featureType: 'transit.station',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#d59563' }]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#17263c' }]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#515c6d' }]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#17263c' }]
            }
          ]
        }}
      >
        {branches.map((branch) => (
          <Marker
            key={branch.id}
            position={{ lat: branch.lat, lng: branch.lng }}
            onClick={() => setSelectedBranch(branch)}
            icon={{
              path: 'M12 0C7.04 0 3 4.04 3 9c0 5.25 9 19 9 19s9-13.75 9-19c0-4.96-4.04-9-9-9zm0 12c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 1.8
            }}
          />
        ))}

        {selectedBranch && (
          <InfoWindow
            position={{ lat: selectedBranch.lat, lng: selectedBranch.lng }}
            onCloseClick={() => setSelectedBranch(null)}
          >
            <div className="p-4 max-w-xs bg-slate-900 text-white rounded-lg">
              <h3 className="font-bold text-lg mb-2 text-white">{selectedBranch.name}</h3>
              <p className="text-sm text-gray-300 mb-2">{selectedBranch.address}</p>
              <p className="text-sm text-gray-300 mb-2">
                <strong>Phone:</strong> <a href={`tel:${selectedBranch.phone}`} className="text-blue-400 hover:underline">{selectedBranch.phone}</a>
              </p>
              <p className="text-sm text-gray-300">
                <strong>Hours:</strong> Mon - Sat: 9 AM - 5 PM
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}
