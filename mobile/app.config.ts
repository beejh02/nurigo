import type {
  ConfigContext,
  ExpoConfig,
} from 'expo/config';


const NAVER_MAP_PLUGIN =
  '@mj-studio/react-native-naver-map';


function legacyNaverMapClientId(
  plugins: ExpoConfig['plugins'],
): string | undefined {
  for (const plugin of plugins ?? []) {
    if (
      Array.isArray(plugin) &&
      plugin[0] === NAVER_MAP_PLUGIN
    ) {
      const options =
        plugin[1] as
          | { client_id?: unknown }
          | undefined;


      if (
        typeof options?.client_id === 'string' &&
        options.client_id.trim()
      ) {
        return options.client_id.trim();
      }
    }
  }


  return undefined;
}


export default (
  { config }: ConfigContext,
): ExpoConfig => {
  const naverMapClientId =
    process.env.NAVER_MAP_CLIENT_ID?.trim() ||
    legacyNaverMapClientId(
      config.plugins,
    );


  if (!naverMapClientId) {
    throw new Error(
      'NAVER_MAP_CLIENT_ID가 필요합니다. mobile/.env.example을 참고하세요.',
    );
  }


  return {
    ...config,
    name:
      config.name ?? 'mobile',
    slug:
      config.slug ?? 'mobile',
    version:
      config.version ?? '1.0.0',
    orientation:
      'portrait',
    icon:
      './assets/images/icon.png',
    scheme:
      'mobile',
    userInterfaceStyle:
      'automatic',
    ios: {
      ...config.ios,
      icon:
        './assets/expo.icon',
    },
    android: {
      ...config.android,
      package:
        'com.beejh02.nurigo',
      adaptiveIcon: {
        backgroundColor:
          '#E6F4FE',
        foregroundImage:
          './assets/images/android-icon-foreground.png',
        backgroundImage:
          './assets/images/android-icon-background.png',
        monochromeImage:
          './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled:
        false,
    },
    web: {
      ...config.web,
      output:
        'static',
      favicon:
        './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor:
            '#208AEF',
          image:
            './assets/images/splash-icon.png',
          imageWidth:
            76,
        },
      ],
      [
        NAVER_MAP_PLUGIN,
        {
          client_id:
            naverMapClientId,
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            extraMavenRepos: [
              'https://repository.map.naver.com/archive/maven',
            ],
          },
        },
      ],
    ],
    experiments: {
      ...config.experiments,
      typedRoutes:
        true,
      reactCompiler:
        true,
    },
  };
};
