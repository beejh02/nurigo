import {
  StyleSheet,
} from 'react-native';

import {
  NaverMapMarkerOverlay,
  NaverMapPolygonOverlay,
  NaverMapPolylineOverlay,
  NaverMapView,
} from '@mj-studio/react-native-naver-map';

import type {
  Coordinate,
  MarketBoundary,
  SavedMarketPolygon,
} from '../types';


type MarketMapProps = {
  currentLocation: Coordinate;
  boundary: MarketBoundary;
  polygonPoints: Coordinate[];
  savedPolygon: SavedMarketPolygon | null;
  onTapMap: (point: Coordinate) => void;
};


function getBoundaryPolygons(
  boundary: MarketBoundary,
): Coordinate[][][] {
  if (boundary.geometry.type === 'Polygon') {
    return [
      boundary.geometry.rings,
    ];
  }


  return boundary.geometry.polygons;
}


export function MarketMap({
  currentLocation,
  boundary,
  polygonPoints,
  savedPolygon,
  onTapMap,
}: MarketMapProps) {
  const boundaryPolygons =
    getBoundaryPolygons(
      boundary,
    );


  return (
    <NaverMapView
      style={styles.map}

      camera={{
        latitude:
          currentLocation.latitude,

        longitude:
          currentLocation.longitude,

        zoom:
          16,
      }}

      isShowLocationButton={
        true
      }

      onTapMap={(event) => {
        onTapMap({
          latitude:
            event.latitude,

          longitude:
            event.longitude,
        });
      }}
    >
      <NaverMapMarkerOverlay
        latitude={
          currentLocation.latitude
        }

        longitude={
          currentLocation.longitude
        }

        caption={{
          text:
            '현재 위치',
        }}
      />


      {boundaryPolygons.map(
        (
          rings,
          polygonIndex,
        ) => (
          <NaverMapPolygonOverlay
            key={
              `${boundary.marketId}-${boundary.revision}-${polygonIndex}`
            }

            coords={
              rings[0] ?? []
            }

            holes={
              rings.slice(1)
            }

            color={
              'rgba(255, 140, 0, 0.20)'
            }

            outlineColor={
              '#ff8c00'
            }

            outlineWidth={
              3
            }
          />
        ),
      )}


      {polygonPoints.map(
        (
          point,
          index,
        ) => (
          <NaverMapMarkerOverlay
            key={
              `${point.latitude}-${point.longitude}-${index}`
            }

            latitude={
              point.latitude
            }

            longitude={
              point.longitude
            }

            caption={{
              text:
                `${index + 1}`,
            }}

            image={{
              symbol:
                'blue',
            }}
          />
        ),
      )}


      {polygonPoints.length >= 2 && (
        <NaverMapPolylineOverlay
          coords={
            polygonPoints
          }

          width={
            4
          }

          color={
            '#0078ff'
          }
        />
      )}


      {savedPolygon && (
        <NaverMapPolygonOverlay
          coords={
            savedPolygon.points
          }

          color={
            'rgba(0, 120, 255, 0.25)'
          }

          outlineColor={
            '#0078ff'
          }

          outlineWidth={
            3
          }
        />
      )}
    </NaverMapView>
  );
}


const styles =
  StyleSheet.create({
    map: {
      flex:
        1,
    },
  });
