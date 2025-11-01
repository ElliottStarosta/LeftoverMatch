'use client'

import { useEffect, useRef, useState } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface DirectionsMapProps {
  destinationAddress: string
}

export function DirectionsMap({ destinationAddress }: DirectionsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const routeControl = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mapInitializedRef = useRef(false)

  useEffect(() => {
    if (!mapContainer.current) {
      setError('Map container not available')
      return
    }

    // Load Leaflet CSS
    const leafletCss = document.createElement('link')
    leafletCss.rel = 'stylesheet'
    leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(leafletCss)

    // Load Leaflet Routing Machine CSS
    const routingCss = document.createElement('link')
    routingCss.rel = 'stylesheet'
    routingCss.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css'
    document.head.appendChild(routingCss)

    // Load scripts
    Promise.all([
      new Promise<void>((resolve) => {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => resolve()
        script.onerror = () => {
          setError('Failed to load Leaflet')
          resolve()
        }
        document.body.appendChild(script)
      }),
      new Promise<void>((resolve) => {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js'
        script.onload = () => resolve()
        script.onerror = () => {
          setError('Failed to load routing')
          resolve()
        }
        document.body.appendChild(script)
      }),
    ]).then(() => {
      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const userLat = position.coords.latitude
            const userLng = position.coords.longitude

            // Initialize map once
            if (!mapInitializedRef.current && mapContainer.current) {
              mapInitializedRef.current = true

              try {
                map.current = (window as any).L.map(mapContainer.current).setView(
                  [userLat, userLng],
                  13
                )

                  // Add OpenStreetMap tiles
                  ; (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution:
                      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    maxZoom: 19,
                  }).addTo(map.current)

                  // Add user marker
                  ; (window as any).L.marker([userLat, userLng], {
                    title: 'Your Location',
                  })
                    .addTo(map.current)
                    .bindPopup('📍 Your Location')
              } catch (err) {
                setError('Error initializing map')
                return
              }
            }

            // Geocode destination address
            try {
              const coords = await geocodeAddress(destinationAddress)

              if (coords && map.current) {
                // Add destination marker
                ; (window as any).L.marker([coords.lat, coords.lng], {
                  title: destinationAddress,
                })
                  .addTo(map.current)
                  .bindPopup(`📍 ${destinationAddress}`)

                // Clear previous route
                if (routeControl.current) {
                  map.current.removeControl(routeControl.current)
                }

                // Add route with directions
                routeControl.current = (window as any).L.Routing.control({
                  waypoints: [
                    (window as any).L.latLng(userLat, userLng),
                    (window as any).L.latLng(coords.lat, coords.lng),
                  ],
                  routeWhileDragging: false,
                  showAlternatives: true,
                  addWaypoints: false,
                  draggableWaypoints: false,
                  lineOptions: {
                    styles: [
                      { color: '#f97316', opacity: 0.9, weight: 6 },
                      { color: '#ffffff', opacity: 0.8, weight: 3 }
                    ],
                  },
                  createMarker: () => null,
                  plan: new ((window as any).L.Routing.Plan)(
                    [(window as any).L.latLng(userLat, userLng), (window as any).L.latLng(coords.lat, coords.lng)],
                    {
                      createMarker: () => null,
                      draggableWaypoints: false,
                      addWaypoints: false,
                    }
                  ),
                }).addTo(map.current)

                // Fit bounds to show entire route
                const group = new (window as any).L.featureGroup([
                  (window as any).L.latLng(userLat, userLng),
                  (window as any).L.latLng(coords.lat, coords.lng),
                ])
                map.current.fitBounds(group.getBounds(), { padding: [50, 50] })

                setLoading(false)
              } else {
                setError('Could not find destination address')
                setLoading(false)
              }
            } catch (err) {
              setError('Error loading route')
              setLoading(false)
            }
          },
          (error) => {
            initMapWithDefaultLocation()
          }
        )
      } else {
        initMapWithDefaultLocation()
      }

      function initMapWithDefaultLocation() {
        if (!mapInitializedRef.current && mapContainer.current) {
          mapInitializedRef.current = true
          try {
            map.current = (window as any).L.map(mapContainer.current).setView([40.7128, -74.006], 13)

              ; (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution:
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
              }).addTo(map.current)

            setError('Location access denied. Showing default map.')
            setLoading(false)
          } catch (err) {
            setError('Error initializing map')
            setLoading(false)
          }
        }
      }
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        mapInitializedRef.current = false
      }
    }
  }, [destinationAddress])

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 bg-orange-100 rounded-2xl flex items-center justify-center z-10">
          <LoadingSpinner text="Loading directions..." fullScreen={false} size="sm" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-red-50 rounded-2xl flex items-center justify-center z-10">
          <div className="text-center px-4">
            <p className="text-sm text-red-600 font-semibold">❌ {error}</p>
          </div>
        </div>
      )}
      <div
        ref={mapContainer}
        className="w-full h-full rounded-2xl overflow-hidden"
        data-testid="map-container"
      />
    </div>
  )
}

// Helper function to geocode address
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    )
    const data = await response.json()

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
    }
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}