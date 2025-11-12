"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Map, { Source, Layer } from "react-map-gl/maplibre";
import { Button, Space, message } from "antd";
import { MapIcon, SatelliteIcon, LocateFixed, Maximize, Minimize } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

// Default center (Vietnam - Ho Chi Minh City)
const defaultCenter = { lng: 106.660172, lat: 10.762622 };

// Vietnam geographic bounds for validation
const VIETNAM_BOUNDS = {
  lng: { min: 102, max: 110 }, // Longitude (kinh độ)
  lat: { min: 8, max: 24 },    // Latitude (vĩ độ)
};

/**
 * Validate if coordinates are within Vietnam bounds
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @returns {boolean}
 */
const isWithinVietnamBounds = (lng, lat) => {
  return (
    !isNaN(lng) &&
    !isNaN(lat) &&
    lng >= VIETNAM_BOUNDS.lng.min &&
    lng <= VIETNAM_BOUNDS.lng.max &&
    lat >= VIETNAM_BOUNDS.lat.min &&
    lat <= VIETNAM_BOUNDS.lat.max
  );
};

// Get OpenMap API keys
const OPENMAP_API_KEY = process.env.NEXT_PUBLIC_OPENMAP_API_KEY || "";
const OPENMAP_API_KEY_V1 = process.env.NEXT_PUBLIC_OPENMAP_API_KEY_V1 || "";

// Collect available keys
const AVAILABLE_KEYS = [OPENMAP_API_KEY, OPENMAP_API_KEY_V1].filter(Boolean);

/**
 * Get OpenMap style URL with specific API key
 * @param {string} style - Map style ID (day-v1, satellite-v1)
 * @param {string} apiKey - OpenMap API key
 * @returns {string} OpenMap style JSON URL
 */
const getOpenMapStyleUrl = (style = "day-v1", apiKey) => {
  return `https://maptiles.openmap.vn/styles/${style}/style.json?apikey=${apiKey}`;
};

/**
 * MapLibreWithPolygon Component
 *
 * Display OpenMap.vn (Bản đồ mở Việt Nam) with farm boundary polygon overlay
 * Uses OpenMap.vn - Free Vietnamese mapping service from A80 Group
 *
 * Features:
 * - Normal map mode (OpenMap day-v1 style)
 * - Satellite mode (OpenMap satellite imagery)
 * - Toggle button to switch between modes
 * - Farm boundary polygon overlay with green fill
 * - Automatic validation for Vietnam coordinates
 * - Display from backend API data (Boundary + CenterLocation)
 *
 * @param {Array} boundary - GeoJSON Polygon from backend: [[[lng, lat], [lng, lat], ...]]
 *                           - Format từ API: Boundary field
 *                           - Example từ backend:
 *                           [[[105.6252, 10.4583], [105.6352, 10.4583],
 *                             [105.6352, 10.4483], [105.6252, 10.4483],
 *                             [105.6252, 10.4583]]]
 *                           - Must be closed polygon (first point = last point)
 *                           - Coordinates: [longitude, latitude] hoặc [kinh độ, vĩ độ]
 *
 * @param {Array} centerLocation - GeoJSON Point from backend: [lng, lat]
 *                                 - Format từ API: CenterLocation field
 *                                 - Example từ backend: [105.6302, 10.4533]
 *                                 - Used to center the map view
 *
 * @param {Object} mapOptions - Additional MapLibre options (zoom, bearing, pitch, etc.)
 *
 * Backend API Format (farm_api_report.md):
 * - Boundary: GeoJSONPolygon - [[[lng,lat],...]]
 * - CenterLocation: GeoJSONPoint - [lng, lat]
 * - Coordinate order: [longitude, latitude] theo chuẩn GeoJSON
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_OPENMAP_API_KEY: OpenMap API key (get from https://openmap.vn)
 */
export default function MapLibreWithPolygon({
  boundary,
  centerLocation,
  mapOptions = {},
}) {
  const mapRef = useRef(null);
  const [mapStyle, setMapStyle] = useState("normal");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState(() => {
    // Random selection between available keys on mount
    if (AVAILABLE_KEYS.length === 0) return "";
    const randomIndex = Math.floor(Math.random() * AVAILABLE_KEYS.length);
    console.log(`✓ Using API key #${randomIndex + 1} of ${AVAILABLE_KEYS.length}`);
    return AVAILABLE_KEYS[randomIndex];
  });
  const [errorCount, setErrorCount] = useState(0);

  // Check if OpenMap API keys are configured
  useEffect(() => {
    if (AVAILABLE_KEYS.length === 0) {
      console.error("❌ No OpenMap API keys configured. Please set NEXT_PUBLIC_OPENMAP_API_KEY in .env file");
      console.info("ℹ️ Get your API key from: https://openmap.vn");
      message.error("Không tìm thấy API key cho bản đồ");
    } else {
      console.log(`✓ ${AVAILABLE_KEYS.length} OpenMap API key(s) configured`);
    }
  }, []);

  // Handle map error - switch to next available key
  const handleMapError = useCallback((error) => {
    console.error("❌ Map error:", error);

    if (AVAILABLE_KEYS.length <= 1) {
      console.error("❌ No alternative API keys available");
      message.error("Lỗi tải bản đồ và không có key dự phòng");
      return;
    }

    // Find next key (rotate to different key)
    const currentIndex = AVAILABLE_KEYS.indexOf(currentApiKey);
    const nextIndex = (currentIndex + 1) % AVAILABLE_KEYS.length;
    const nextKey = AVAILABLE_KEYS[nextIndex];

    console.log(`🔄 Switching to API key #${nextIndex + 1}...`);
    setCurrentApiKey(nextKey);
    setErrorCount(prev => prev + 1);

    if (errorCount < 5) {
      message.warning(`Đang thử API key khác... (${errorCount + 1})`);
    } else {
      message.error("Tất cả API keys đều gặp lỗi");
    }
  }, [currentApiKey, errorCount]);

  // Get map center from centerLocation or calculate from boundary
  const mapCenter = useMemo(() => {
    // Priority 1: Use centerLocation from API if available (GeoJSON format: [lng, lat])
    if (
      centerLocation &&
      Array.isArray(centerLocation) &&
      centerLocation.length === 2
    ) {
      const lng = parseFloat(centerLocation[0]); // longitude (kinh độ)
      const lat = parseFloat(centerLocation[1]); // latitude (vĩ độ)

      // Validate coordinates are valid numbers and within Vietnam bounds
      if (isWithinVietnamBounds(lng, lat)) {
        console.log("✓ Valid centerLocation:", { lng, lat });
        return { lng, lat };
      }
      console.warn("✗ Invalid centerLocation (out of Vietnam bounds):", {
        provided: centerLocation,
        parsed: { lng, lat },
        bounds: VIETNAM_BOUNDS,
      });
    }

    // Priority 2: Calculate centroid from boundary polygon if centerLocation not available
    // Boundary format: [[[lng, lat], [lng, lat], ...]]
    if (boundary && Array.isArray(boundary) && boundary.length > 0) {
      const outerRing = boundary[0]; // First ring is outer boundary
      if (Array.isArray(outerRing) && outerRing.length > 0) {
        // Calculate polygon centroid using average of all points
        // Note: This is a simple arithmetic mean, not geometric centroid
        // For more accuracy, could use proper polygon centroid algorithm
        let sumLng = 0;
        let sumLat = 0;
        let validPoints = 0;

        outerRing.forEach((point) => {
          if (Array.isArray(point) && point.length >= 2) {
            const lng = parseFloat(point[0]);
            const lat = parseFloat(point[1]);
            if (!isNaN(lng) && !isNaN(lat)) {
              sumLng += lng;
              sumLat += lat;
              validPoints++;
            }
          }
        });

        if (validPoints > 0) {
          return {
            lng: sumLng / validPoints,
            lat: sumLat / validPoints,
          };
        }
      }
    }

    // Priority 3: Default to Ho Chi Minh City center
    console.warn("Using default center - no valid coordinates provided");
    return defaultCenter;
  }, [centerLocation, boundary]);

  // Create GeoJSON for polygon with validation
  const polygonGeoJSON = useMemo(() => {
    if (!boundary || !Array.isArray(boundary) || boundary.length === 0) {
      return null;
    }

    // Validate boundary structure: [[[lng, lat], [lng, lat], ...]]
    const outerRing = boundary[0];
    if (!Array.isArray(outerRing) || outerRing.length < 3) {
      console.error("Invalid boundary: must have at least 3 points", boundary);
      return null;
    }

    // Validate each coordinate point
    const invalidPoints = [];
    const validCoordinates = outerRing.every((point, index) => {
      if (!Array.isArray(point) || point.length < 2) {
        invalidPoints.push({ index, reason: "Invalid array format", point });
        return false;
      }
      const lng = parseFloat(point[0]);
      const lat = parseFloat(point[1]);
      // Check if coordinates are valid numbers and within Vietnam bounds
      if (!isWithinVietnamBounds(lng, lat)) {
        invalidPoints.push({
          index,
          reason: "Out of Vietnam bounds",
          point: { lng, lat },
        });
        return false;
      }
      return true;
    });

    if (!validCoordinates) {
      console.error("✗ Invalid boundary polygon:", {
        totalPoints: outerRing.length,
        invalidPoints,
        bounds: VIETNAM_BOUNDS,
      });
      return null;
    }

    console.log("✓ Valid boundary polygon:", {
      points: outerRing.length,
      firstPoint: outerRing[0],
      lastPoint: outerRing[outerRing.length - 1],
    });

    // GeoJSON Polygon format: coordinates array of linear rings
    // First ring is exterior boundary, subsequent rings are holes
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: boundary, // Format: [[[lng, lat], [lng, lat], ...]]
      },
      properties: {
        validated: true,
      },
    };
  }, [boundary]);

  const toggleMapStyle = () => {
    setMapStyle((prev) => (prev === "normal" ? "satellite" : "normal"));
  };

  // Reset view to boundary location
  const resetView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [mapCenter.lng, mapCenter.lat],
        zoom: 15,
        duration: 1000, // Animation duration in ms
      });
    }
  }, [mapCenter]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Generate map styles dynamically based on current API key
  const mapStyles = useMemo(() => ({
    normal: getOpenMapStyleUrl("day-v1", currentApiKey),
    satellite: getOpenMapStyleUrl("satellite-v1", currentApiKey),
  }), [currentApiKey]);

  return (
    <div
      style={{
        width: "100%",
        height: isFullscreen ? "100vh" : "400px",
        position: isFullscreen ? "fixed" : "relative",
        top: isFullscreen ? 0 : "auto",
        left: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 9999 : "auto",
        backgroundColor: "#fff"
      }}
    >
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: mapCenter.lng,
          latitude: mapCenter.lat,
          zoom: 15,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyles[mapStyle]}
        onError={handleMapError}
        {...mapOptions}
      >
        {/* Draw polygon if boundary exists */}
        {polygonGeoJSON && (
          <Source id="farm-boundary" type="geojson" data={polygonGeoJSON}>
            {/* Fill layer */}
            <Layer
              id="farm-boundary-fill"
              type="fill"
              paint={{
                "fill-color": "#4CAF50",
                "fill-opacity": 0.3,
              }}
            />
            {/* Outline layer */}
            <Layer
              id="farm-boundary-outline"
              type="line"
              paint={{
                "line-color": "#2E7D32",
                "line-width": 2,
                "line-opacity": 0.8,
              }}
            />
          </Source>
        )}
      </Map>

      {/* Map controls */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1,
        }}
      >
        <Space direction="vertical">
          {/* Toggle map style button */}
          <Button
            type="primary"
            icon={mapStyle === "normal" ? <SatelliteIcon size={16} /> : <MapIcon size={16} />}
            onClick={toggleMapStyle}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {mapStyle === "normal" ? "Vệ tinh" : "Bản đồ"}
          </Button>

          {/* Reset view button */}
          <Button
            icon={<LocateFixed size={16} />}
            onClick={resetView}
            title="Quay lại vị trí boundary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Định vị
          </Button>

          {/* Fullscreen toggle button */}
          <Button
            icon={isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            onClick={toggleFullscreen}
            title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
          </Button>
        </Space>
      </div>
    </div>
  );
}
