// Mock for react-native-google-mobile-ads — used in Expo Go where native module is unavailable
const noop = () => {};
const noopPromise = () => Promise.resolve();

const BannerAd = () => null;
BannerAd.displayName = 'BannerAdMock';

const BannerAdSize = {
  BANNER: 'BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  FULL_BANNER: 'FULL_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
};

const AdEventType = {
  LOADED: 'loaded',
  ERROR: 'error',
  OPENED: 'opened',
  CLICKED: 'clicked',
  CLOSED: 'closed',
};

const RewardedAdEventType = {
  ...AdEventType,
  EARNED_REWARD: 'earned_reward',
};

const TestIds = {
  BANNER: 'ca-app-pub-3940256099942544/2934735716',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/4411468910',
  REWARDED: 'ca-app-pub-3940256099942544/1712485313',
};

const createFakeAd = () => ({
  load: noop,
  show: noopPromise,
  addAdEventListener: () => noop,
});

const InterstitialAd = {
  createForAdRequest: () => createFakeAd(),
};

const RewardedAd = {
  createForAdRequest: () => createFakeAd(),
};

const RewardedInterstitialAd = {
  createForAdRequest: () => createFakeAd(),
};

const MobileAds = () => ({ initialize: noopPromise });

module.exports = {
  BannerAd,
  BannerAdSize,
  AdEventType,
  RewardedAdEventType,
  TestIds,
  InterstitialAd,
  RewardedAd,
  RewardedInterstitialAd,
  MobileAds,
  default: { initialize: noopPromise },
};
