"use client";

import { useState, useMemo, useRef } from "react";
import Map, { Source, Layer } from "react-map-gl/maplibre";
import { Button } from "antd";
import { MapIcon, SatelliteIcon } from "lucide-react";
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

// Get OpenMap API key from environment variable
const OPENMAP_API_KEY = process.env.NEXT_PUBLIC_OPENMAP_API_KEY || "";

/**
 * Get OpenMap style URL
 * OpenMap uses MapLibre style JSON format
 * @param {string} style - Map style ID (day-v1, night-v1, etc.)
 * @returns {string} OpenMap style JSON URL
 */
const getOpenMapStyleUrl = (style = "day-v1") => {
  return `https://maptiles.openmap.vn/styles/${style}/style.json?apikey=${OPENMAP_API_KEY}`;
};

// Map style configurations using OpenMap.vn
const MAP_STYLES = {
  normal: getOpenMapStyleUrl("day-v1"), // OpenMap day style (normal map)
  satellite: getOpenMapStyleUrl("satellite-v1"), // OpenMap satellite style
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

  // Check if OpenMap API key is configured
  if (!OPENMAP_API_KEY) {
    console.error("❌ OpenMap API key not configured. Please set NEXT_PUBLIC_OPENMAP_API_KEY in .env file");
    console.info("ℹ️ Get your API key from: https://openmap.vn");
  } else {
    console.log("✓ OpenMap API key configured");
  }

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

  return (
    <div style={{ width: "100%", height: "400px", position: "relative" }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: mapCenter.lng,
          latitude: mapCenter.lat,
          zoom: 15,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLES[mapStyle]}
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

      {/* Map style toggle button */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1,
        }}
      >
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
      </div>
    </div>
  );
}
