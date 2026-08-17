export function getNurigoApiBaseUrl(): string {
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL
      ?.trim()
      .replace(
        /\/+$/,
        '',
      );


  if (!apiBaseUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.',
    );
  }


  return apiBaseUrl;
}
