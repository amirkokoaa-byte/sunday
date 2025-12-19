
/**
 * Calculates the distance between two points in meters using the Haversine formula.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Extracts coordinates from various Google Maps URL formats or raw strings.
 */
export const parseCoordinates = (input: string): { lat: number; lng: number } | null => {
  if (!input) return null;

  // 1. Simple check for "lat,lng" format
  const parts = input.split(',').map(p => parseFloat(p.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }

  // 2. Check for google maps URL patterns
  // Pattern A: @lat,lng
  const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const matchAt = input.match(regexAt);
  if (matchAt) {
    return { lat: parseFloat(matchAt[1]), lng: parseFloat(matchAt[2]) };
  }

  // Pattern B: q=lat,lng or ll=lat,lng
  const regexQuery = /[?&](q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const matchQuery = input.match(regexQuery);
  if (matchQuery) {
    return { lat: parseFloat(matchQuery[2]), lng: parseFloat(matchQuery[3]) };
  }

  // Pattern C: search/lat,lng
  const regexSearch = /\/search\/(-?\d+\.\d+),(-?\d+\.\d+)/;
  const matchSearch = input.match(regexSearch);
  if (matchSearch) {
    return { lat: parseFloat(matchSearch[1]), lng: parseFloat(matchSearch[2]) };
  }

  return null;
};

/**
 * Resolves a shortened Google Maps URL (maps.app.goo.gl) to get the final URL containing coordinates.
 */
export const resolveShortLink = async (url: string): Promise<string | null> => {
  try {
    // We use a CORS proxy because we can't follow redirects across origins directly in the browser
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    // AllOrigins returns the final resolved URL in status.url
    if (data.status && data.status.url) {
      return data.status.url;
    }
    
    // Fallback: search in the content for common coordinate patterns if redirect wasn't captured
    return data.contents || null;
  } catch (error) {
    console.error("Failed to resolve short link:", error);
    return null;
  }
};
