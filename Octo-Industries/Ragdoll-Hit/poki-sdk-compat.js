(() => {
  const noop = () => {};
  const resolved = () => Promise.resolve();

  window.PokiSDK = Object.freeze({
    init: resolved,
    initWithVideoHB: resolved,
    customEvent: noop,
    commercialBreak: resolved,
    rewardedBreak: () => Promise.resolve(false),
    displayAd: noop,
    destroyAd: noop,
    getLeaderboard: resolved,
    getSharableURL: () => Promise.reject(new Error('Sharing is unavailable offline.')),
    getURLParam: () => '',
    disableProgrammatic: noop,
    gameLoadingStart: noop,
    gameLoadingFinished: noop,
    gameInteractive: noop,
    roundStart: noop,
    roundEnd: noop,
    muteAd: noop,
    setDebug: noop,
    gameplayStart: noop,
    gameplayStop: noop,
    gameLoadingProgress: noop,
    happyTime: noop,
    setPlayerAge: noop,
    togglePlayerAdvertisingConsent: noop,
    logError: noop,
    sendHighscore: noop,
    setDebugTouchOverlayController: noop,
  });
})();