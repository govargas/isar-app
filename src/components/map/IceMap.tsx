import { useState, useCallback, useMemo } from 'react';
import { Map } from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { useNavigate } from 'react-router-dom';
import { useIceStore } from '@/stores/iceStore';
import { useIceData } from '@/hooks/useIceData';
import { getStatusColor, MAP_STYLE } from '@/lib/constants';
import { StatusChip } from '@/components/ui/StatusChip';
import type { LakeFeature } from '@/types';
import 'maplibre-gl/dist/maplibre-gl.css';

interface HoverInfo {
  x: number;
  y: number;
  object: LakeFeature;
}

export function IceMap() {
  const navigate = useNavigate();
  const { lakes, loading } = useIceData();
  const viewState = useIceStore((state) => state.viewState);
  const setViewState = useIceStore((state) => state.setViewState);
  const hoveredLakeId = useIceStore((state) => state.hoveredLakeId);
  const setHoveredLakeId = useIceStore((state) => state.setHoveredLakeId);

  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  // Convert lakes to GeoJSON features
  const lakeFeatures = useMemo(() => {
    return lakes.map((lake) => ({
      type: 'Feature' as const,
      geometry: lake.geometry,
      properties: lake,
    }));
  }, [lakes]);

  // Get user reports as points
  const reportPoints = useMemo(() => {
    return lakes.flatMap((lake) =>
      (lake.user_reports || []).map((report) => ({
        ...report,
        lakeName: lake.name,
        coordinates: report.location?.coordinates || lake.centroid.coordinates,
      }))
    );
  }, [lakes]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewStateChange = useCallback((evt: any) => {
    if (evt.viewState) {
      setViewState(evt.viewState);
    }
  }, [setViewState]);

  const handleHover = useCallback(
    (info: { x: number; y: number; object?: LakeFeature }) => {
      if (info.object) {
        setHoverInfo({
          x: info.x,
          y: info.y,
          object: info.object,
        });
        setHoveredLakeId(info.object.properties.id);
      } else {
        setHoverInfo(null);
        setHoveredLakeId(null);
      }
    },
    [setHoveredLakeId]
  );

  const handleClick = useCallback(
    (info: { object?: LakeFeature }) => {
      if (info.object) {
        navigate(`/lake/${info.object.properties.slug}`);
      }
    },
    [navigate]
  );

  const layers = useMemo(
    () => [
      // Lake fill layer
      new GeoJsonLayer({
        id: 'lakes-fill',
        data: lakeFeatures,
        filled: true,
        stroked: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getFillColor: (d: any) => {
          const isHovered = d.properties.id === hoveredLakeId;
          return getStatusColor(d.properties.status, isHovered ? 180 : 100);
        },
        pickable: true,
        onHover: handleHover,
        onClick: handleClick,
        updateTriggers: {
          getFillColor: [hoveredLakeId],
        },
      }),

      // Lake outline layer (glow effect)
      new GeoJsonLayer({
        id: 'lakes-outline-glow',
        data: lakeFeatures,
        filled: false,
        stroked: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getLineColor: (d: any) => {
          const isHovered = d.properties.id === hoveredLakeId;
          return getStatusColor(d.properties.status, isHovered ? 200 : 80);
        },
        lineWidthMinPixels: 4,
        lineWidthMaxPixels: 8,
        updateTriggers: {
          getLineColor: [hoveredLakeId],
        },
      }),

      // Lake outline layer (sharp)
      new GeoJsonLayer({
        id: 'lakes-outline',
        data: lakeFeatures,
        filled: false,
        stroked: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getLineColor: (d: any) => {
          const isHovered = d.properties.id === hoveredLakeId;
          return getStatusColor(d.properties.status, isHovered ? 255 : 180);
        },
        lineWidthMinPixels: 1,
        lineWidthMaxPixels: 2,
        updateTriggers: {
          getLineColor: [hoveredLakeId],
        },
      }),

      // User report markers
      new ScatterplotLayer({
        id: 'reports',
        data: reportPoints,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getPosition: (d: any) => d.coordinates,
        getRadius: 150,
        getFillColor: [0, 212, 255, 200],
        getLineColor: [0, 212, 255, 255],
        lineWidthMinPixels: 2,
        stroked: true,
        pickable: true,
        radiusMinPixels: 4,
        radiusMaxPixels: 10,
      }),
    ],
    [lakeFeatures, reportPoints, hoveredLakeId, handleHover, handleClick]
  );

  return (
    <div className="relative w-full h-full">
      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={{
          dragRotate: true,
          touchRotate: true,
          keyboard: true,
        }}
        layers={layers}
        getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'grab')}
      >
        <Map mapStyle={MAP_STYLE} />
      </DeckGL>

      {/* Hover tooltip */}
      {hoverInfo && (
        <div
          className="absolute pointer-events-none z-10 animate-fade-in"
          style={{
            left: hoverInfo.x + 12,
            top: hoverInfo.y + 12,
          }}
        >
          <div className="glass rounded-lg p-3 shadow-lg min-w-[180px]">
            <h3 className="font-semibold text-[var(--color-frost-white)] mb-1">
              {hoverInfo.object.properties.name}
            </h3>
            {hoverInfo.object.properties.region && (
              <p className="text-xs text-[var(--color-frost-muted)] mb-2">
                {hoverInfo.object.properties.region}
              </p>
            )}
            <StatusChip status={hoverInfo.object.properties.status} size="sm" />
            {hoverInfo.object.properties.ice_thickness_cm && (
              <p className="text-xs text-[var(--color-frost-muted)] mt-2">
                Ice: {hoverInfo.object.properties.ice_thickness_cm} cm
              </p>
            )}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-deep)]/80 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[var(--color-ice-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--color-frost-muted)]">Loading ice data...</p>
          </div>
        </div>
      )}

      {/* Map controls hint */}
      <div className="absolute bottom-4 left-4 text-xs text-[var(--color-frost-dim)] glass rounded px-2 py-1">
        Drag to pan • Scroll to zoom • Right-drag to rotate
      </div>
    </div>
  );
}
