'use client'

import { useEffect } from 'react'
import { useLocationStore } from '../store/locationStore'

/**
 * This component initializes the Zustand stores on app startup.
 * It doesn't render anything visible, but it triggers the initial
 * location tracking and other setup tasks.
 */
export default function StoreInitializer() {
  const { startLocationTracking } = useLocationStore()
  
  // Initialize location tracking on first render
  useEffect(() => {
    startLocationTracking()
    
    // Cleanup on unmount
    return () => {
      const { stopLocationTracking } = useLocationStore.getState()
      stopLocationTracking()
    }
  }, [startLocationTracking])
  
  // This component doesn't render anything visible
  return null
} 