# 개발 가이드

> 기준일: 2026-08-17

현재 앱은 저장소 루트의 `mobile/`에 있습니다. Naver Map 네이티브 모듈을 사용하므로 Expo Go가 아니라 Android 개발 빌드로 실행합니다.

## 준비 사항

- Node.js와 npm
- Android Studio, Android SDK와 호환되는 JDK
- Android Emulator 또는 USB 디버깅을 활성화한 실제 기기
- 이 프로젝트에 허용된 Naver Map Client ID

Naver Map Client ID는 저장소나 문서에 직접 기록하지 않습니다. 현재 `mobile/app.json`은 Git에서 제외되어 있으므로 새 개발 환경에서는 프로젝트 관리자로부터 로컬 설정을 안전하게 전달받아야 합니다. 설정 템플릿이 추가되기 전까지는 이 과정이 수동입니다.

## 설치와 정적 검사

PowerShell에서 저장소 루트를 기준으로 실행합니다.

```powershell
Set-Location .\mobile
npm ci
npx.cmd tsc --noEmit
```

의존성 변경이 필요한 경우에는 Expo SDK와 호환되는 버전을 선택하기 위해 `npx.cmd expo install <package>`를 사용합니다.

## Android 개발 빌드

최초 설치, 네이티브 모듈 추가, config plugin 또는 앱 설정 변경 뒤에는 개발 빌드를 다시 생성합니다.

```powershell
Set-Location .\mobile
npx.cmd expo run:android
```

개발 빌드가 이미 기기나 Emulator에 설치되어 있고 JavaScript 또는 TypeScript 코드만 바뀌었다면 Metro를 다시 연결합니다.

```powershell
Set-Location .\mobile
npx.cmd expo start --dev-client
```

Naver Map은 네이티브 의존성을 포함하므로 Expo Go만으로는 현재 앱을 검증할 수 없습니다.

## 위치 기능 확인

1. 앱 최초 실행 시 포그라운드 위치 권한을 허용합니다.
2. 지도에 현재 위치 Marker가 나타나는지 확인합니다.
3. 현재 번들에는 검증용 전통시장 데이터 하나만 있으므로 다른 위치에서는 시장 Polygon이 화면 밖에 있을 수 있습니다.
4. 등록 Polygon을 확인할 때는 Emulator 위치를 대상 시장 부근으로 설정하거나 시장을 선택해 카메라를 이동하는 기능을 사용합니다.
5. 권한 거부와 위치 획득 실패 상태도 각각 확인합니다.

현재 구현은 `getCurrentPositionAsync`로 위치를 한 번만 가져옵니다. 연속 위치 추적과 배터리·정확도 정책은 지오펜스 MVP 단계에서 별도로 결정합니다.

## Polygon 데이터 제작 흐름

1. 지도에서 정점을 3개 이상 선택합니다.
2. Polygon 이름을 입력해 앱 문서 디렉터리에 JSON을 저장합니다.
3. 개발용 Android 앱의 내부 `files` 디렉터리에서 JSON을 추출합니다.
4. 추출 파일은 임시 수집물로 보관하고 좌표, 이름, 지역과 출처를 검수합니다.
5. 검수한 데이터를 표준 GeoJSON으로 변환해 `packages/market-data`의 해당 지역 디렉터리에 반영합니다.
6. 모바일은 원본 파일을 복사하지 않고 패키지의 Naver Map 어댑터를 통해 좌표를 받습니다.

현재 루트에 있는 JSON은 이 흐름을 도입하기 전의 레거시 데이터입니다. 새 시장을 수집하기 전에 [시장 경계 데이터 관리](./MARKET_DATA.md)의 패키지와 검증 절차를 먼저 구현합니다.

ADB로 앱 내부 파일을 확인할 때는 로컬 앱 설정의 Android package 값을 사용합니다.

```powershell
adb shell run-as <android-package> ls -la files
adb exec-out run-as <android-package> cat files/<market-file>.json
```

## 변경 전 검증 기준

```powershell
Set-Location .\mobile
npx.cmd tsc --noEmit
```

지오펜스 로직이 추가되면 중심점, 외부점, 경계선, 꼭짓점과 잘못된 Polygon에 대한 단위 테스트를 함께 실행해야 합니다. 위치 또는 지도 동작 변경은 정적 검사만으로 완료 처리하지 않고 Android 실기기 또는 Emulator에서 확인합니다.

## 공식 기준 자료

- [Expo SDK 57 Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/)
- [Expo SDK 57 Dev Client](https://docs.expo.dev/versions/v57.0.0/sdk/dev-client/)
- [Expo SDK 57 Expo Router](https://docs.expo.dev/versions/v57.0.0/sdk/router/)

Expo SDK를 업그레이드할 때는 이 문서의 명령과 API 설명을 새 SDK의 버전 고정 문서에 맞춰 갱신합니다.
