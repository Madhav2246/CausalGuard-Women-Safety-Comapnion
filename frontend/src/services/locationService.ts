interface Coordinates {
  lat: number;
  lng: number;
}

let watchId: number | null = null;
let lastKnownLocation: Coordinates | null = null;

export const locationService = {
  getCurrentLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          lastKnownLocation = coords;
          resolve(coords);
        },
        (error) => {
          let msg = "Failed to retrieve location.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Permission denied for location services.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Location information is unavailable.";
          } else if (error.code === error.TIMEOUT) {
            msg = "Request to get user location timed out.";
          }
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  },

  watchLocation(callback: (coords: Coordinates) => void, onError?: (error: Error) => void): number {
    if (watchId !== null) {
      this.stopWatching();
    }

    if (!navigator.geolocation) {
      if (onError) onError(new Error("Geolocation is not supported."));
      return -1;
    }

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        lastKnownLocation = coords;
        callback(coords);
      },
      (error) => {
        if (onError) onError(new Error(error.message));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return watchId;
  },

  stopWatching() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  },

  getCachedLocation(): Coordinates | null {
    return lastKnownLocation;
  }
};
