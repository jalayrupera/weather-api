export const generateBrowserFingerprint = (): string => {
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory || "unknown",
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    screenColorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    sessionStorage: !!window.sessionStorage,
    localStorage: !!window.localStorage,
    indexedDb: !!window.indexedDB,
    plugins: Array.from(navigator.plugins || [])
      .map((p) => p.name)
      .join(","),
    canvas: getCanvasFingerprint(),
    webGL: getWebGLFingerprint(),
  };

  return hashObject(fingerprint);
};

export const getUserIP = async (): Promise<string | null> => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    
    return data.ip;
  } catch (error) {
    return null;
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
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
};

const getCanvasFingerprint = (): string => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "canvas-unsupported";

    canvas.width = 200;
    canvas.height = 50;

    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 200, 50);

    ctx.fillStyle = "#069";
    ctx.font = "15px Arial";
    ctx.fillText("Browser Fingerprint", 10, 25);
    ctx.strokeStyle = "rgba(200, 0, 200, 0.8)";
    ctx.beginPath();
    ctx.arc(50, 30, 15, 0, Math.PI * 2);
    ctx.stroke();

    const dataUrl = canvas.toDataURL();
    return dataUrl.substring(0, 100);
  } catch (e) {
    return "canvas-error";
  }
};

const getWebGLFingerprint = (): string => {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return "webgl-unsupported";

    const info = {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      extensions: gl.getSupportedExtensions()?.join(","),
    };

    return JSON.stringify(info).substring(0, 100);
  } catch (e) {
    return "webgl-error";
  }
};

const hashObject = (obj: any): string => {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const detectTimezoneMismatch = (): boolean => {
  try {
    const dateTimeFormat = new Intl.DateTimeFormat();
    const options = dateTimeFormat.resolvedOptions();
    const browserTimezone = options.timeZone;
    const browserOffset = new Date().getTimezoneOffset();

    const tzParts = browserTimezone.split("/");

    if (tzParts.length < 2) {
      console.warn(
        "Unusual timezone format but not flagging as suspicious:",
        browserTimezone
      );
      return false;
    }

    const continent = tzParts[0].toLowerCase();

    const offsetHours = -browserOffset / 60;

    let isSuspicious = false;

    if (continent === "america" && (offsetHours < -12 || offsetHours > 0)) {
      isSuspicious = true;
    } else if (
      continent === "europe" &&
      (offsetHours < -2 || offsetHours > 6)
    ) {
      isSuspicious = true;
    } else if (continent === "asia" && (offsetHours < 1 || offsetHours > 14)) {
      isSuspicious = true;
    } else if (
      continent === "australia" &&
      (offsetHours < 6 || offsetHours > 14)
    ) {
      isSuspicious = true;
    } else if (
      continent === "africa" &&
      (offsetHours < -2 || offsetHours > 6)
    ) {
      isSuspicious = true;
    }

    console.log("Timezone check:", {
      browserTimezone,
      offsetHours,
      continent,
      isSuspicious,
    });

    return isSuspicious;
  } catch (error) {
    console.error("Error in detectTimezoneMismatch:", error);
    return false;
  }
};

export const detectTimestampManipulation = (
  locationTimestamp: number
): boolean => {
  const currentTime = Date.now();
  const timeDifference = Math.abs(currentTime - locationTimestamp);

  const isManipulated = timeDifference > 30 * 60 * 1000;

  console.log("Timestamp check:", {
    locationTime: new Date(locationTimestamp).toISOString(),
    systemTime: new Date(currentTime).toISOString(),
    differenceMs: timeDifference,
    differenceMinutes: Math.round(timeDifference / (60 * 1000)),
    isManipulated,
  });

  if (timeDifference > 10 * 60 * 1000 && timeDifference <= 30 * 60 * 1000) {
    console.warn(
      "Timestamp difference detected but within acceptable range:",
      Math.round(timeDifference / (60 * 1000)),
      "minutes"
    );
  }

  return isManipulated;
};

export const storeFingerprint = (fingerprint: string): void => {
  try {
    localStorage.setItem("browser_fingerprint", fingerprint);
    localStorage.setItem("fingerprint_timestamp", Date.now().toString());
  } catch (e) {
    console.error("Failed to store fingerprint:", e);
  }
};

export const checkFingerprintConsistency = (): boolean => {
  try {
    const storedFingerprint = localStorage.getItem("browser_fingerprint");
    if (!storedFingerprint) return true;

    const currentFingerprint = generateBrowserFingerprint();

    const fingerprintAttempts = parseInt(
      localStorage.getItem("fingerprint_attempts") || "0"
    );

    if (storedFingerprint !== currentFingerprint) {
      const newAttempts = fingerprintAttempts + 1;
      localStorage.setItem("fingerprint_attempts", newAttempts.toString());

      console.log("Fingerprint mismatch:", {
        storedFingerprint,
        currentFingerprint,
        attempts: newAttempts,
        isConsistent: newAttempts < 3,
      });

      return newAttempts < 3;
    }

    localStorage.setItem("fingerprint_attempts", "0");
    return true;
  } catch (e) {
    console.error("Failed to check fingerprint consistency:", e);
    return true;
  }
};

export const verifyClient = async (
  latitude?: number,
  longitude?: number
): Promise<{
  isValid: boolean;
  message: string | null;
}> => {
  try {
    const fingerprint = generateBrowserFingerprint();

    const fingerprintConsistent = checkFingerprintConsistency();
    if (!fingerprintConsistent) {
      return {
        isValid: false,
        message:
          "Browser fingerprint has changed significantly. Please reload the page.",
      };
    }

    storeFingerprint(fingerprint);

    const timezoneMismatch = detectTimezoneMismatch();
    if (timezoneMismatch) {
      return {
        isValid: false,
        message:
          "Detected potential VPN usage. Please disable VPN for accurate weather data.",
      };
    }

    return {
      isValid: true,
      message: null,
    };
  } catch (error) {
    console.error("Error in verifyClient:", error);

    return {
      isValid: true,
      message: null,
    };
  }
};

export const checkTimezoneConsistency = (
  latitude: number,
  longitude: number
): Promise<{ consistent: boolean; deviceTimezone: string; locationTimezone?: string }> => {
  return new Promise(async (resolve) => {
    try {
      // Get the device's timezone
      const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Get the timezone at the provided coordinates
      try {
        const response = await fetch(
          `https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_API_KEY&format=json&by=position&lat=${latitude}&lng=${longitude}`
        );
        const data = await response.json();
        
        if (data.status === "OK") {
          const locationTimezone = data.zoneName;
          
          // Check if timezones match or are close
          // We're being lenient here because timezone APIs can differ in exact naming
          const isConsistent = deviceTimezone.includes(locationTimezone) || 
                               locationTimezone.includes(deviceTimezone) ||
                               areTimezonesClose(deviceTimezone, locationTimezone);
          
          resolve({
            consistent: isConsistent,
            deviceTimezone,
            locationTimezone
          });
        } else {
          // If API fails, we'll be lenient and assume it's consistent
          resolve({
            consistent: true,
            deviceTimezone
          });
        }
      } catch (error) {
        // If there's an error, we'll be lenient and assume it's consistent
        resolve({
          consistent: true,
          deviceTimezone
        });
      }
    } catch (error) {
      // If there's a general error, we'll be lenient
      resolve({
        consistent: true,
        deviceTimezone: "unknown"
      });
    }
  });
};

// Helper function to determine if two timezones are likely to be in the same region
const areTimezonesClose = (timezone1: string, timezone2: string): boolean => {
  // Extract regions from timezone strings (e.g., "America/New_York" -> "America")
  const region1 = timezone1.split("/")[0];
  const region2 = timezone2.split("/")[0];
  
  // If the regions match, they're close enough
  return region1 === region2;
};

// Check if the timestamp is consistent with the current time
export const checkTimestampConsistency = (timestamp: number): boolean => {
  const timestampDate = new Date(timestamp);
  const currentDate = new Date();
  
  // Get the difference in minutes
  const diffInMinutes = Math.abs(
    (currentDate.getTime() - timestampDate.getTime()) / (1000 * 60)
  );
  
  // If the difference is more than 5 minutes, it's suspicious
  return diffInMinutes <= 5;
};

// Function to detect VPNs and proxies
export const detectVPN = async (): Promise<boolean> => {
  try {
    // Try to detect VPN or proxy using a service
    const response = await fetch("https://ipqualityscore.com/api/json/ip/YOUR_API_KEY/", {
      method: "GET",
    });
    
    const data = await response.json();
    
    // If the service indicates a proxy, VPN, or Tor usage, return true
    if (data && (data.proxy || data.vpn || data.tor)) {
      return true;
    }
    
    return false;
  } catch (error) {
    // If the check fails, we'll be lenient and assume no VPN
    return false;
  }
};

// Function to save the fingerprint in localStorage
export const saveBrowserFingerprint = (): string => {
  const fingerprint = generateBrowserFingerprint();
  localStorage.setItem("browserFingerprint", fingerprint);
  return fingerprint;
};

// Function to check if the current fingerprint matches the saved one
export const checkBrowserFingerprint = (): boolean => {
  const savedFingerprint = localStorage.getItem("browserFingerprint");
  
  // If there's no saved fingerprint, save the current one and return true
  if (!savedFingerprint) {
    saveBrowserFingerprint();
    return true;
  }
  
  const currentFingerprint = generateBrowserFingerprint();
  
  // If the fingerprints don't match, it's suspicious
  const matched = currentFingerprint === savedFingerprint;
  
  return matched;
};

// Comprehensive security check
export const performSecurityCheck = async (
  latitude: number,
  longitude: number,
  timestamp: number
): Promise<{ success: boolean; reason?: string }> => {
  try {
    // Check timestamp consistency
    const isTimestampConsistent = checkTimestampConsistency(timestamp);
    if (!isTimestampConsistent) {
      return { 
        success: false,
        reason: "Timestamp is inconsistent with current time" 
      };
    }
    
    // Check browser fingerprint
    const isFingerprintValid = checkBrowserFingerprint();
    if (!isFingerprintValid) {
      return { 
        success: false,
        reason: "Browser fingerprint has changed" 
      };
    }
    
    // Check timezone consistency
    const timezoneCheck = await checkTimezoneConsistency(latitude, longitude);
    if (!timezoneCheck.consistent) {
      return { 
        success: false,
        reason: "Device timezone doesn't match location timezone" 
      };
    }
    
    return { success: true };
  } catch (error) {
    // If there's any error in the security checks, we'll be lenient
    return { success: true };
  }
};
