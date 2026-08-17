import {
  StyleSheet,
  View,
} from 'react-native';

import {
  ScreenMessage,
} from '@/components/screen-message';

import {
  useCurrentLocation,
} from '@/features/location/use-current-location';

import {
  MarketMap,
} from '@/features/markets/components/market-map';

import {
  MarketNameModal,
} from '@/features/markets/components/market-name-modal';

import {
  PolygonEditorPanel,
} from '@/features/markets/components/polygon-editor-panel';

import {
  bundledMarketBoundaryRepository,
} from '@/features/markets/repositories/bundled-market-boundary-repository';

import {
  useMarketBoundary,
} from '@/features/markets/use-market-boundary';

import {
  usePolygonEditor,
} from '@/features/markets/use-polygon-editor';


export default function HomeScreen() {
  const currentLocation =
    useCurrentLocation();

  const marketBoundary =
    useMarketBoundary(
      bundledMarketBoundaryRepository,
      {
        regionCode:
          'daejeon',
      },
    );

  const polygonEditor =
    usePolygonEditor();


  if (currentLocation.error) {
    return (
      <ScreenMessage>
        {currentLocation.error}
      </ScreenMessage>
    );
  }


  if (
    currentLocation.isLoading
    || !currentLocation.location
  ) {
    return (
      <ScreenMessage>
        현재 위치 확인 중...
      </ScreenMessage>
    );
  }


  if (marketBoundary.error) {
    return (
      <ScreenMessage>
        {marketBoundary.error}
      </ScreenMessage>
    );
  }


  if (
    marketBoundary.isLoading
    || !marketBoundary.boundary
  ) {
    return (
      <ScreenMessage>
        전통시장 경계 확인 중...
      </ScreenMessage>
    );
  }


  const currentCoordinate = {
    latitude:
      currentLocation.location.coords.latitude,

    longitude:
      currentLocation.location.coords.longitude,
  };


  return (
    <View style={styles.container}>
      <MarketMap
        currentLocation={
          currentCoordinate
        }

        boundary={
          marketBoundary.boundary
        }

        polygonPoints={
          polygonEditor.points
        }

        savedPolygon={
          polygonEditor.savedPolygon
        }

        onTapMap={
          polygonEditor.addPoint
        }
      />


      <PolygonEditorPanel
        pointCount={
          polygonEditor.points.length
        }

        savedPolygon={
          polygonEditor.savedPolygon
        }

        onUndo={
          polygonEditor.undoPoint
        }

        onReset={
          polygonEditor.reset
        }

        onRequestSave={
          polygonEditor.requestSave
        }

        onClearSavedPolygon={
          polygonEditor.clearSavedPolygon
        }
      />


      <MarketNameModal
        visible={
          polygonEditor.isNameModalVisible
        }

        marketName={
          polygonEditor.marketName
        }

        onChangeMarketName={
          polygonEditor.setMarketName
        }

        onCancel={
          polygonEditor.closeNameModal
        }

        onConfirm={
          polygonEditor.confirmSave
        }
      />
    </View>
  );
}


const styles =
  StyleSheet.create({
    container: {
      flex:
        1,
    },
  });
