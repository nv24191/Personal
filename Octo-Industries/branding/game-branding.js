(() => {
  const scriptElement = document.currentScript || Array.from(document.querySelectorAll('script')).find((element) =>
    /game-branding\.js(?:\?|$)/.test(element.src || '')
  );

  if (!scriptElement || !document.body) {
    return;
  }

  const scriptUrl = scriptElement.src;
  const logoUrl = new URL('octo-industries-logo-source.jpg', scriptUrl).href;
  const hubUrl = new URL('../../index.html#home', scriptUrl).href;

  const badge = document.createElement('a');
  badge.className = 'octo-game-brand';
  badge.href = hubUrl;
  badge.setAttribute('aria-label', 'Return to the Octo Industries Game Hub');
  badge.title = 'Return to the Octo Industries Game Hub';

  const badgeMark = document.createElement('span');
  badgeMark.className = 'octo-game-brand-mark';
  const badgeImage = document.createElement('img');
  badgeImage.src = logoUrl;
  badgeImage.alt = '';
  badgeImage.draggable = false;
  badgeImage.loading = 'eager';
  badgeMark.append(badgeImage);

  const badgeName = document.createElement('span');
  badgeName.className = 'octo-game-brand-name';
  badgeName.textContent = 'Octo Industries';
  badge.append(badgeMark, badgeName);

  const watermark = document.createElement('img');
  watermark.className = 'octo-game-watermark';
  watermark.src = logoUrl;
  watermark.alt = '';
  watermark.setAttribute('aria-hidden', 'true');
  watermark.draggable = false;
  watermark.loading = 'eager';

  document.body.append(badge, watermark);
})();
