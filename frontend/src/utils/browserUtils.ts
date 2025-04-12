/**
 * Browser utility functions for geolocation operations
 */

/**
 * Checks if the current environment supports geolocation
 */
export const checkGeolocationSupport = (): {
  supported: boolean;
  secureContext: boolean;
  details: Record<string, any>;
} => {
  const supported = 'geolocation' in navigator;
  const secureContext = window.isSecureContext;
  
  return {
    supported,
    secureContext,
    details: {
      protocol: window.location.protocol,
      host: window.location.host,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      onLine: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      hasPermissionsAPI: 'permissions' in navigator,
    }
  };
};

/**
 * Checks the current geolocation permission status using the Permissions API
 * Note: This only works in browsers that support the Permissions API
 */
export const checkGeolocationPermission = async (): Promise<{
  supported: boolean;
  state?: 'granted' | 'denied' | 'prompt';
  error?: string;
}> => {
  if (!('permissions' in navigator)) {
    return {
      supported: false,
      error: 'Permissions API not supported'
    };
  }
  
  try {
    const permissionStatus = await navigator.permissions.query({ 
      name: 'geolocation' as PermissionName 
    });
    
    return {
      supported: true,
      state: permissionStatus.state as 'granted' | 'denied' | 'prompt'
    };
  } catch (error) {
    return {
      supported: true,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Test if geolocation works by attempting to get the current position
 */
export const testGeolocation = (): Promise<{
  success: boolean;
  position?: GeolocationPosition;
  error?: {
    code: number;
    message: string;
    type: string;
  };
}> => {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({
        success: false,
        error: {
          code: 0,
          message: 'Geolocation API not supported',
          type: 'UnsupportedError'
        }
      });
      return;
    }
    
    const timeoutId = setTimeout(() => {
      resolve({
        success: false,
        error: {
          code: 3,
          message: 'Manually timed out after 5 seconds',
          type: 'TimeoutError'
        }
      });
    }, 5000);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve({
          success: true,
          position
        });
      },
      (error) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            type: error.constructor.name
          }
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Run a complete diagnostic on geolocation capabilities
 */
export const runGeolocationDiagnostic = async (): Promise<{
  supportInfo: ReturnType<typeof checkGeolocationSupport>;
  permissionInfo: Awaited<ReturnType<typeof checkGeolocationPermission>>;
  testResult: Awaited<ReturnType<typeof testGeolocation>>;
}> => {
  const supportInfo = checkGeolocationSupport();
  const permissionInfo = await checkGeolocationPermission();
  const testResult = await testGeolocation();
  
  return {
    supportInfo,
    permissionInfo,
    testResult
  };
}; 