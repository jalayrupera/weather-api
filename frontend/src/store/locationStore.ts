import { create } from 'zustand';
import { detectTimestampManipulation, verifyClient } from '../utils/securityUtils';
import { LocationData, LocationStore } from '../types/weather';
import { runGeolocationDiagnostic } from '../utils/browserUtils';

// Helper functions
async function verifyTimezoneConsistency(
  latitude: number,
  longitude: number
): Promise<boolean> {
  try {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const estimatedTimezoneHours = Math.round(longitude / 15);
    const browserOffsetHours = -new Date().getTimezoneOffset() / 60;
    const hourDifference = Math.abs(
      browserOffsetHours - estimatedTimezoneHours
    );

    return hourDifference <= 4;
  } catch (error) {
    return true;
  }
}

// This function is now replaced by the store method verifyCoordinatesValidity
// Only keeping for backward compatibility
function verifyCoordinatesValidity(
  latitude: number,
  longitude: number
): boolean {
  try {
    const isValidLatitude = latitude >= -90 && latitude <= 90;
    const isValidLongitude = longitude >= -180 && longitude <= 180;

    const hasDecimalPrecision =
      String(latitude).includes(".") &&
      String(longitude).includes(".") &&
      String(latitude).split(".")[1].length > 1 &&
      String(longitude).split(".")[1].length > 1;

    const prevLatitude = parseFloat(
      sessionStorage.getItem("prev_latitude") || "0"
    );
    const prevLongitude = parseFloat(
      sessionStorage.getItem("prev_longitude") || "0"
    );

    let hasNaturalVariation = true;
    if (prevLatitude !== 0 && prevLongitude !== 0) {
      const distance = calculateDistance(
        latitude,
        longitude,
        prevLatitude,
        prevLongitude
      );

      const previousIdenticalCount = parseInt(
        sessionStorage.getItem("identical_readings_count") || "0"
      );

      if (distance === 0) {
        sessionStorage.setItem(
          "identical_readings_count",
          (previousIdenticalCount + 1).toString()
        );
        
        hasNaturalVariation = true;
      } else {
        sessionStorage.setItem("identical_readings_count", "0");
      }

      const tooFar = distance > 200;
      hasNaturalVariation = hasNaturalVariation && !tooFar;
    }

    sessionStorage.setItem("prev_latitude", String(latitude));
    sessionStorage.setItem("prev_longitude", String(longitude));

    return (
      isValidLatitude &&
      isValidLongitude &&
      (hasDecimalPrecision || hasNaturalVariation)
    );
  } catch (error) {
    return true;
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  // Initial state
  location: null,
  coordinates: null,
  locationHistory: [],
  loading: true,
  error: null,
  highPrecision: true,
  isLocationValid: true,
  locationValidationMessage: null,
  watchId: null,
  
  // Simple actions
  setLocation: (location) => set({ location }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setHighPrecision: (highPrecision) => {
    const state = get();
    // Preserve the current location
    const currentLocation = state.location;
    
    // Update the state first
    set({ 
      highPrecision, 
      loading: true,
      // Keep current location during transition
      // but clear any errors
      error: null,
    });
    
    // Stop current tracking
    state.stopLocationTracking();
    
    // If we have existing location data, immediately validate it under the new precision rules
    if (currentLocation) {
      // Re-validate with the new precision setting
      state.validateLocation(currentLocation)
        .then(isValid => {
          // If validation passes, keep using the existing location
          if (isValid) {
            set({ 
              loading: false,
              error: null,
              isLocationValid: true
            });
          } else {
            // If validation fails but we're going from high precision to low precision,
            // we can still use the existing location
            if (!highPrecision) {
              set({ 
                loading: false,
                error: null,
                isLocationValid: true
              });
            } else {
              // Otherwise, we need new location data with higher precision
              // Start new tracking session without clearing location
              state.startLocationTracking();
            }
          }
        });
    } else {
      // If no location exists, we need to start tracking
      state.startLocationTracking();
    }
  },
  setLocationValid: (isValid) => set({ isLocationValid: isValid }),
  setLocationValidationMessage: (message) => set({ locationValidationMessage: message }),
  setWatchId: (id) => set({ watchId: id }),
  
  // Handle position success
  processPosition: async (position: GeolocationPosition) => {
    const state = get();
    const { locationHistory = [] } = state;

    // Create a new location entry
    const newCoordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };

    // Save the new coordinates
    set({ coordinates: newCoordinates });

    // Add to location history for validation
    const updatedHistory = [...locationHistory, newCoordinates];
    if (updatedHistory.length > 5) {
      // Keep the history at a manageable size
      updatedHistory.shift();
    }
    set({ locationHistory: updatedHistory });

    // Verify the coordinates
    const isValid = await get().verifyCoordinatesValidity(newCoordinates, updatedHistory);
    if (isValid) {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };

      // Full validation
      const state = get();
      const isValidLocation = await state.validateLocation(locationData);

      if (isValidLocation) {
        set({
          location: locationData,  // Set location instead of currentLocation
          loading: false,
          error: null,
          isLocationValid: true
        });
      }
    }
  },
  
  // Handle position error
  handlePositionError: (err: GeolocationPositionError) => {
    if (err instanceof GeolocationPositionError) {
      switch (err.code) {
        case 1:
          set({ 
            error: "Location access was denied. Please enable location permissions in your browser settings and refresh the page."
          });
          break;
        case 2:
          set({ 
            error: "Unable to determine your location. Please check if location services are enabled on your device and try again."
          });
          break;
        case 3:
          set({ 
            error: "Location request timed out. Please check your connection and try again."
          });
          break;
        default:
          set({ 
            error: "An unknown error occurred while getting your location."
          });
      }
    } else {
      set({ 
        error: "An error occurred while fetching your location. Please try again."
      });
    }
    
    set({ loading: false });
  },
  
  // Complex location validation
  validateLocation: async (locationData: LocationData) => {
    const state = get();
    const { highPrecision } = state;
    
    // If we're in low precision mode, we can be more forgiving with accuracy
    const accuracyThreshold = highPrecision ? 90 : 500;
    
    if (locationData.accuracy > accuracyThreshold) {
      // Only show this as invalid if we're in high precision mode
      if (highPrecision) {
        set({
          isLocationValid: false,
          locationValidationMessage: `Location accuracy is too low (${locationData.accuracy.toFixed(0)}m > ${accuracyThreshold}m). Please enable high-precision location.`
        });
        return false;
      }
    }

    // Skip rigorous validation in low precision mode
    if (!highPrecision) {
      set({
        isLocationValid: true,
        locationValidationMessage: null,
      });
      return true;
    }

    // Rest of validation only applies to high precision mode
    let suspicionScore = 0;
    let suspicionReason = "";
    let detectedIssues: string[] = [];

    const coordsValid = verifyCoordinatesValidity(
      locationData.latitude,
      locationData.longitude
    );
    if (!coordsValid) {
      suspicionScore += 5;
      detectedIssues.push("Location pattern inconsistency");
      suspicionReason =
        "Your location data appears unusual. Please ensure your GPS is functioning properly.";
    }

    const timezoneValid = await verifyTimezoneConsistency(
      locationData.latitude,
      locationData.longitude
    );
    if (!timezoneValid) {
      suspicionScore += 5;
      detectedIssues.push("Timezone inconsistency");
      if (!suspicionReason) {
        suspicionReason =
          "Your device timezone doesn't match your location. Please check your settings.";
      }
    }

    const clientVerification = await verifyClient(
      locationData.latitude,
      locationData.longitude
    );
    if (!clientVerification.isValid) {
      suspicionScore += 10;
      detectedIssues.push("Browser fingerprint inconsistency");
      if (!suspicionReason) {
        suspicionReason =
          clientVerification.message ||
          "Browser security checks failed. Please check your settings.";
      }
    }

    if (detectTimestampManipulation(locationData.timestamp)) {
      suspicionScore += 4;
      detectedIssues.push("Timestamp inconsistency");
      if (!suspicionReason) {
        suspicionReason =
          "Location timestamp is inconsistent with system time. Location data may be compromised.";
      }
    }

    if (suspicionScore >= 10) {
      set({
        isLocationValid: false,
        locationValidationMessage: suspicionReason +
          " If you believe this is an error, please try refreshing your browser."
      });
      return false;
    }

    set({
      isLocationValid: true,
      locationValidationMessage: null,
    });
    return true;
  },
  
  // Start tracking location
  startLocationTracking: async () => {
    const state = get();
    const currentLocation = state.location;
    
    // Stop any existing tracking
    state.stopLocationTracking();
    
    // Don't set loading if we have a valid location already
    // This prevents UI flashing during precision toggles
    if (!currentLocation) {
      set({ loading: true });
    }
    
    // Use existing location immediately if we have it
    if (currentLocation) {
      // Just revalidate the existing location with current settings
      const isValid = await state.validateLocation(currentLocation);
      
      if (isValid || !state.highPrecision) {
        // If valid or in low precision mode, use it right away
        set({ 
          error: null,
          isLocationValid: true, 
          loading: false 
        });
      }
    }
    
    // Run diagnostic to check geolocation capability
    try {
      const diagnosticResult = await runGeolocationDiagnostic();
      
      // Early exit if permission is explicitly denied
      if (diagnosticResult.permissionInfo.state === 'denied') {
        // If we have an existing location, just use it instead of showing error
        if (currentLocation) {
          set({ loading: false });
        } else {
          set({ 
            error: "Location access was denied. Please enable location permissions in your browser settings and refresh the page.",
            loading: false
          });
        }
        return;
      }
      
      // Early exit if geolocation test failed
      if (!diagnosticResult.testResult.success) {
        let errorMessage = "Location access failed.";
        
        switch (diagnosticResult.testResult.error?.code) {
          case 1:
            errorMessage = "Location access was denied. Please enable location permissions.";
            break;
          case 2:
            errorMessage = "Unable to determine your location. Please check if location services are enabled.";
            break;
          case 3:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        
        // If we have an existing location, just use it and don't show error
        if (currentLocation) {
          set({ loading: false });
        } else {
          set({ 
            error: errorMessage,
            loading: false
          });
        }
        return;
      }
    } catch (diagErr) {
      // Continue even if diagnostic fails
    }
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      // If we have an existing location, just use it instead of showing error
      if (currentLocation) {
        set({ loading: false });
      } else {
        set({ 
          error: "Geolocation is not supported by your browser.",
          loading: false
        });
      }
      return;
    }
    
    try {
      // Try to get a quick position first
      try {
        const quickPosition = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            const quickTimeoutId = setTimeout(() => {
              reject(new Error("Quick position timeout"));
            }, 5000);

            navigator.geolocation.getCurrentPosition(
              (position) => {
                clearTimeout(quickTimeoutId);
                resolve(position);
              },
              (error) => {
                clearTimeout(quickTimeoutId);
                reject(error);
              },
              {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300000,
              }
            );
          }
        );
        
        await state.processPosition(quickPosition);
        
        // After getting quick position, try for a more accurate one if needed
        if (state.highPrecision) {
          navigator.geolocation.getCurrentPosition(
            async (precisePosition) => {
              if (
                !quickPosition ||
                precisePosition.coords.accuracy < quickPosition.coords.accuracy
              ) {
                await state.processPosition(precisePosition);
              }
            },
            (error) => {
              // Non-blocking error, continue with quick position
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 60000,
            }
          );
        }
      } catch (err) {
        // If we have existing location data, just use it and don't show error
        if (currentLocation) {
          set({ 
            loading: false,
            error: null
          });
        } else {
          state.handlePositionError(err as GeolocationPositionError);
        }
      }
      
      // Set up continuous location watching even if initial position failed
      try {
        const id = navigator.geolocation.watchPosition(
          position => {
            state.processPosition(position);
          },
          error => {
            state.handlePositionError(error);
          },
          {
            enableHighAccuracy: state.highPrecision,
            timeout: 15000,
            maximumAge: 60000,
          }
        );
        
        set({ watchId: id });
      } catch (watchErr) {
        // Non-blocking error
      }
      
    } catch (err) {
      // If we have an existing location, use it instead of showing an error
      if (currentLocation) {
        set({ 
          loading: false,
          error: null
        });
      } else {
        set({ 
          error: "Failed to set up location monitoring. " + (err instanceof Error ? err.message : String(err)),
          loading: false
        });
      }
    }
  },
  
  // Stop tracking location
  stopLocationTracking: () => {
    const { watchId } = get();
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      set({ watchId: null });
    }
  },
  
  // Refresh location data
  refreshLocation: async () => {
    const state = get();
    set({ loading: true, error: null });
    await state.startLocationTracking();
  },

  // Verify coordinates validity
  verifyCoordinatesValidity: async (
    newCoords: Coordinates,
    history: Coordinates[]
  ): Promise<boolean> => {
    // If this is the first reading, accept it
    if (history.length <= 1) {
      return true;
    }

    // Check for identical coordinates (which would be suspicious except when toggling precision)
    // Always consider identical coordinates as valid to prevent issues when toggling precision settings
    const hasIdenticalCoordinates = history.length >= 2 && 
      history.some(coord => 
        coord !== newCoords && // Not the same object
        coord.latitude === newCoords.latitude && 
        coord.longitude === newCoords.longitude
      );
    
    if (hasIdenticalCoordinates) {
      return true;
    }

    // Check if the new coordinates are too far from previous ones (potential GPS spoofing)
    // Increased distance threshold from 100km to 200km for better user experience
    const maxDistanceKm = 200;
    const previousCoords = history[history.length - 2];
    const distanceKm = calculateDistance(
      previousCoords.latitude,
      previousCoords.longitude,
      newCoords.latitude,
      newCoords.longitude
    );

    if (distanceKm > maxDistanceKm) {
      set({
        isLocationValid: false,
        locationValidationMessage: `Unexpected location jump detected (${distanceKm.toFixed(0)}km). Please refresh if you've actually traveled this far.`
      });
      return false;
    }

    return true;
  },
})); 

export async function validateLocation(position: GeolocationPosition) {
  const { latitude, longitude } = position.coords;

  if (!position || !validateCoordinates(latitude, longitude)) {
    return { success: false };
  }

  // Check for timezone consistency
  const isTimezoneConsistent = await verifyTimezoneConsistency(
    latitude,
    longitude
  );

  if (!isTimezoneConsistent) {
    return {
      success: false,
      error: "Location validation failed: timezone inconsistency detected",
    };
  }

  // Check for VPN
  try {
    // Basic VPN check
    const vpnResponse = await fetch("https://ipapi.co/json/");
    const ipData = await vpnResponse.json();

    const ipLatitude = ipData.latitude;
    const ipLongitude = ipData.longitude;

    if (ipLatitude && ipLongitude) {
      const distance = calculateDistance(
        latitude,
        longitude,
        ipLatitude,
        ipLongitude
      );

      if (distance > 500) {
        return {
          success: false,
          error: "Location validation failed: VPN detected",
        };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: true }; // Silently pass if the VPN check fails
  }
} 