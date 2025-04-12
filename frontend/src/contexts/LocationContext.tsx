"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { LocationContextType, LocationData } from "../types/weather";
import {
  verifyClient,
  detectTimestampManipulation,
} from "../utils/securityUtils";

const LocationContext = createContext<LocationContextType>({
  location: null,
  loading: false,
  error: null,
  highPrecision: true,
  isLocationValid: true,
  locationValidationMessage: null,
  setHighPrecision: () => { },
  refreshLocation: async () => { },
});

export const useLocation = () => useContext(LocationContext);

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

    console.log("Timezone verification:", {
      browserTimezone,
      estimatedTimezoneHours,
      browserOffsetHours,
      hourDifference,
      isConsistent: hourDifference <= 4,
    });

    return hourDifference <= 4;
  } catch (error) {
    console.error("Error verifying timezone:", error);
    return true;
  }
}

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

        hasNaturalVariation = previousIdenticalCount < 2;
      } else {
        sessionStorage.setItem("identical_readings_count", "0");
      }

      const tooFar = distance > 100;

      hasNaturalVariation = hasNaturalVariation && !tooFar;

      console.log("Coordinate variation check:", {
        prevCoords: [prevLatitude, prevLongitude],
        currentCoords: [latitude, longitude],
        distance,
        identicalReadings: previousIdenticalCount,
        hasNaturalVariation,
      });
    }

    sessionStorage.setItem("prev_latitude", String(latitude));
    sessionStorage.setItem("prev_longitude", String(longitude));

    return (
      isValidLatitude &&
      isValidLongitude &&
      (hasDecimalPrecision || hasNaturalVariation)
    );
  } catch (error) {
    console.error("Error verifying coordinates validity:", error);
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

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [highPrecision, setHighPrecision] = useState<boolean>(true);
  const [isLocationValid, setIsLocationValid] = useState<boolean>(true);
  const [locationValidationMessage, setLocationValidationMessage] = useState<
    string | null
  >(null);

  const watchIdRef = useRef<number | null>(null);

  const validateLocation = useCallback(
    async (locationData: LocationData): Promise<boolean> => {
      if (locationData.accuracy > 90) {
        setIsLocationValid(false);
        setLocationValidationMessage(
          "Location accuracy is too low (>90m). Please enable high-precision location."
        );
        console.log("Location blocked: accuracy > 90m", locationData.accuracy);
        return false;
      }

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

      console.log(
        `Location validation completed with suspicion score: ${suspicionScore}`,
        detectedIssues
      );

      if (suspicionScore >= 10) {
        setIsLocationValid(false);
        setLocationValidationMessage(
          suspicionReason +
          " If you believe this is an error, please try refreshing your browser."
        );
        return false;
      }

      setIsLocationValid(true);
      setLocationValidationMessage(null);
      return true;
    },
    []
  );

  const processPosition = useCallback(
    async (position: GeolocationPosition) => {
      if (highPrecision && position.coords.accuracy > 500) {
        console.log(
          `Location accuracy (${position.coords.accuracy}m) is too low for high precision mode.`
        );

        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setLocation(locationData);

        await validateLocation(locationData);

        setError(
          "Location accuracy is lower than expected. Weather data may be less precise."
        );
      } else {
        console.log(
          `Location obtained with accuracy: ${position.coords.accuracy}m`
        );
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setLocation(locationData);

        await validateLocation(locationData);

        setError(null);
      }
      setLoading(false);
    },
    [highPrecision, validateLocation]
  );

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    if (err instanceof GeolocationPositionError) {
      switch (err.code) {
        case 1:
          setError(
            "Location access was denied. Please enable location permissions."
          );
          break;
        case 2:
          setError(
            "Unable to determine your location. Please try again later."
          );
          break;
        case 3:
          setError("Location request timed out. Please try again.");
          break;
        default:
          setError("An unknown error occurred while getting your location.");
      }
    } else {
      setError(
        "An error occurred while fetching your location. Please try again."
      );
    }
    setLocation(null);
    setLoading(false);
  }, []);

  const startWatchingPosition = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setLoading(true);

    try {
      const id = navigator.geolocation.watchPosition(
        processPosition,
        handlePositionError,
        {
          enableHighAccuracy: highPrecision,
          timeout: 10000,
          maximumAge: 60000,
        }
      );

      watchIdRef.current = id;
      console.log(
        `Started watching position with ID: ${id}, highPrecision: ${highPrecision}`
      );
    } catch (err) {
      console.error("Error setting up position watch:", err);
      setError("Failed to set up location monitoring.");
      setLoading(false);
    }
  }, [highPrecision, processPosition, handlePositionError]);

  const getCurrentLocation = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const quickPosition = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          const quickTimeoutId = setTimeout(() => {
            console.log(
              "Quick position request timed out, proceeding to high accuracy request"
            );
            reject(new Error("Quick position timeout"));
          }, 2000);

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
              timeout: 2000,
              maximumAge: 300000,
            }
          );
        }
      ).catch((err) => {
        console.log("Quick position request failed:", err);
        throw err;
      });

      await processPosition(quickPosition);

      if (highPrecision) {
        try {
          navigator.geolocation.getCurrentPosition(
            async (precisePosition) => {
              if (
                !quickPosition ||
                precisePosition.coords.accuracy < quickPosition.coords.accuracy
              ) {
                console.log(
                  "Received more precise location:",
                  precisePosition.coords.accuracy
                );
                await processPosition(precisePosition);
              }
            },
            (error) =>
              console.log(
                "High precision position error (non-blocking):",
                error
              ),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            }
          );
        } catch (preciseErr) {
          console.log(
            "Error getting precise location (non-blocking):",
            preciseErr
          );
        }
      }
    } catch (err) {
      handlePositionError(err as GeolocationPositionError);

      setLoading(false);
    }
  }, [highPrecision, processPosition, handlePositionError]);

  useEffect(() => {
    getCurrentLocation().then(() => {
      startWatchingPosition();
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        console.log("Stopped watching position");
      }
    };
  }, [startWatchingPosition, getCurrentLocation]);

  const refreshLocation = useCallback(async () => {
    await getCurrentLocation();

    startWatchingPosition();
  }, [getCurrentLocation, startWatchingPosition]);

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        error,
        highPrecision,
        isLocationValid,
        locationValidationMessage,
        setHighPrecision,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;
