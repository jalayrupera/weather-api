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

    if (data && data.ip) {
      console.log("User IP detected:", data.ip);
      return data.ip;
    }

    return null;
  } catch (error) {
    console.error("Error fetching user IP:", error);
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
