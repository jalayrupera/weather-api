'use client'

import { useEffect, useCallback, useState, useRef } from 'react';
import { useLocationStore } from '../store/locationStore';
import { useWeatherStore } from '../store/weatherStore';
import { Units } from '../types/weather';

export const useWeatherWithLocation = () => {
  // Access both stores
  const {
    location,
    loading: locationLoading,
    error: locationError,
    highPrecision,
    isLocationValid,
    locationValidationMessage,
    setHighPrecision,
    refreshLocation,
    startLocationTracking
  } = useLocationStore();
  
  const {
    weather,
    forecast,
    isLoading: weatherLoading,
    error: weatherError,
    units,
    setUnits,
    fetchWeatherData,
    refreshWeather
  } = useWeatherStore();
  
  // Use refs to prevent infinite loops
  const isMounted = useRef(false);
  const lastFetchedLocationRef = useRef<string | null>(null);
  const locationRef = useRef(location);
  const startLocationTrackingRef = useRef(startLocationTracking);
  
  // Add a ref to track current units to prevent unnecessary changes
  const currentUnitsRef = useRef(units);
  
  // Update refs when dependencies change
  useEffect(() => {
    locationRef.current = location;
    startLocationTrackingRef.current = startLocationTracking;
  }, [location, startLocationTracking]);
  
  // Start location tracking on component mount
  useEffect(() => {
    // Mark as mounted
    isMounted.current = true;
    
    // First mount, start tracking location
    if (!locationRef.current) {
      startLocationTrackingRef.current();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, []);  // Empty dependency array to run only on mount/unmount
  
  // Fetch weather when location changes
  useEffect(() => {
    if (!isMounted.current) return;
    
    // Skip if we're still waiting for location
    if (locationLoading) {
      return;
    }
    
    if (locationRef.current && isLocationValid) {
      // Create a unique key for this location to prevent fetching the same location multiple times
      const locationKey = `${locationRef.current.latitude.toFixed(6)},${locationRef.current.longitude.toFixed(6)}`;
      
      if (locationKey !== lastFetchedLocationRef.current) {
        lastFetchedLocationRef.current = locationKey;
        fetchWeatherData(locationRef.current, isLocationValid);
      }
    }
  }, [location?.latitude, location?.longitude, isLocationValid, locationLoading, fetchWeatherData]);
  
  // Update units ref when units changes
  useEffect(() => {
    currentUnitsRef.current = units;
  }, [units]);
  
  // Handle unit changes safely with debouncing
  const handleSetUnits = useCallback((newUnits: Units) => {
    // Don't do anything if units haven't changed
    if (newUnits === currentUnitsRef.current) {
      return;
    }
    
    // We don't need to show location errors during unit changes
    // The refreshWeather function in Settings.tsx will handle the refresh
    setUnits(newUnits);
  }, [setUnits]);
  
  // Combine both refresh functions
  const refreshAll = useCallback(async () => {
    await refreshLocation();
    
    // Only refresh weather if we have a location - use the ref instead of the direct location value
    // This prevents the callback from having to be recreated when location changes
    if (locationRef.current) {
      await refreshWeather();
    }
  }, [refreshLocation, refreshWeather]);
  
  // Integration point to determine if app is in a loading state
  const isLoading = locationLoading || weatherLoading;
  
  // Combine error messages with priority
  const errorMessage = locationError || weatherError || 
                       (!isLocationValid && locationValidationMessage);
  
  return {
    // Weather data
    weather,
    forecast,
    
    // Location data
    location,
    highPrecision,
    
    // Status flags
    isLoading,
    error: errorMessage,
    isLocationValid,
    
    // Units
    units,
    setUnits: handleSetUnits,
    
    // Actions
    refreshWeather: refreshAll,
    refreshLocation,
    setHighPrecision
  };
}; 