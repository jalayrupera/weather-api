'use client'

import { useEffect } from 'react'
import { useLocationStore } from '../store/locationStore'

export default function StoreInitializer() {
  const { startLocationTracking } = useLocationStore()
  
  useEffect(() => {
    if (typeof startLocationTracking === 'function') {
      startLocationTracking()
      
      return () => {
        const { stopLocationTracking } = useLocationStore.getState()
        if (typeof stopLocationTracking === 'function') {
          stopLocationTracking()
        }
      }
    }
  }, [startLocationTracking])
  
  return null
}