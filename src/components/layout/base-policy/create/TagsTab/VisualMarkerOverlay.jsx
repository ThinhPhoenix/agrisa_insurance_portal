import React, { useEffect, useState, useRef } from 'react';

/**
 * VisualMarkerOverlay Component
 *
 * Displays visual markers (rectangles with numbers) on top of PDF viewer
 * for staged fields that haven't been applied to the PDF yet.
 *
 * @param {Array} stagedFields - Array of staged field objects
 * @param {Object} canvasRefs - Refs to PDF canvas elements (one per page)
 * @param {Object} containerRef - Ref to the scrollable PDF container
 * @param {Number} scale - Current PDF zoom scale (optional, default 1)
 */
const VisualMarkerOverlay = ({
  stagedFields = [],
  canvasRefs,
  containerRef,
  scale = 1
}) => {
  const [markerPositions, setMarkerPositions] = useState([]);
  const animationFrameRef = useRef(null);

  // Calculate marker positions based on canvas and container positions
  const calculatePositions = () => {
    if (!containerRef?.current || !canvasRefs?.current) {
      return [];
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const positions = [];

    stagedFields.forEach((field) => {
      const canvas = canvasRefs.current[field.page];
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();

      // 🔧 FIX: Use canvas coordinates (screen space) instead of PDF coordinates
      // Canvas coordinates are already in the correct coordinate system (top-left origin)
      const left = canvasRect.left - containerRect.left + (field.canvasX || field.x);
      const top = canvasRect.top - containerRect.top + (field.canvasY || field.y);

      positions.push({
        tempId: field.tempId,
        position: field.position,
        left,
        top,
        width: field.canvasWidth || field.width,
        height: field.canvasHeight || field.height,
        page: field.page
      });
    });

    return positions;
  };

  // Update positions on scroll, resize, or zoom
  const updatePositions = () => {
    const positions = calculatePositions();
    setMarkerPositions(positions);
  };

  // Throttled update function using requestAnimationFrame
  const throttledUpdate = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      updatePositions();
    });
  };

  useEffect(() => {
    updatePositions();

    // Listen to scroll events on container
    const container = containerRef?.current;
    if (container) {
      container.addEventListener('scroll', throttledUpdate);
    }

    // Listen to window resize
    window.addEventListener('resize', throttledUpdate);

    return () => {
      if (container) {
        container.removeEventListener('scroll', throttledUpdate);
      }
      window.removeEventListener('resize', throttledUpdate);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stagedFields, scale, canvasRefs, containerRef]);

  // Re-calculate when stagedFields or scale changes
  useEffect(() => {
    updatePositions();
  }, [stagedFields, scale]);

  if (!containerRef?.current || !canvasRefs?.current) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none', // Don't interfere with PDF interactions
        zIndex: 10, // Above PDF, below modal popups
      }}
    >
      {markerPositions.map((marker) => (
        <div
          key={marker.tempId}
          style={{
            position: 'absolute',
            left: `${marker.left}px`,
            top: `${marker.top}px`,
            width: `${marker.width}px`,
            height: `${marker.height}px`,
            border: '2px solid #1890ff',
            background: 'rgba(24, 144, 255, 0.1)',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#1890ff',
            transition: 'all 0.2s ease', // Smooth transitions
            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
          }}
        >
          ({marker.position})
        </div>
      ))}
    </div>
  );
};

export default VisualMarkerOverlay;
