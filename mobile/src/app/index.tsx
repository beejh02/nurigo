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
  MarketBoundarySaveModal,
} from '@/features/markets/components/market-boundary-save-modal';

import {
  PolygonEditorPanel,
} from '@/features/markets/components/polygon-editor-panel';

import {
  httpMarketBoundaryRepository,
} from '@/features/markets/repositories/http-market-boundary-repository';

import {
  httpMarketBoundaryDraftWriter,
} from '@/features/markets/repositories/http-market-boundary-draft-writer';

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
      httpMarketBoundaryRepository,
    );

  const polygonEditor =
    usePolygonEditor({
      draftWriter:
        httpMarketBoundaryDraftWriter,
    });


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

        boundaries={
          marketBoundary.boundaries
        }

        polygonPoints={
          polygonEditor.points
        }

        submittedDraft={
          polygonEditor.submittedDraft
        }

        onTapMap={
          polygonEditor.addPoint
        }
      />


      <PolygonEditorPanel
        registeredBoundaryCount={
          marketBoundary.boundaries.length
        }

        pointCount={
          polygonEditor.points.length
        }

        submittedDraft={
          polygonEditor.submittedDraft
        }

        isSaving={
          polygonEditor.isSaving
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

        onClearSubmittedDraft={
          polygonEditor.clearSubmittedDraft
        }
      />


      <MarketBoundarySaveModal
        visible={
          polygonEditor.isSaveModalVisible
        }

        marketName={
          polygonEditor.marketName
        }

        regionCode={
          polygonEditor.regionCode
        }

        adminToken={
          polygonEditor.adminToken
        }

        isSaving={
          polygonEditor.isSaving
        }

        onChangeMarketName={
          polygonEditor.setMarketName
        }

        onChangeRegionCode={
          polygonEditor.setRegionCode
        }

        onChangeAdminToken={
          polygonEditor.setAdminToken
        }

        onCancel={
          polygonEditor.closeSaveModal
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
