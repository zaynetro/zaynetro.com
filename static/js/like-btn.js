const path = readLocation();
const btn = document.querySelector('#like-btn');

function readLocation() {
  const p = location.pathname;
  if (p.endsWith('/')) {
    return p + '/';
  } else {
    return p;
  }
}

function getLikeKey() {
  return encodeURIComponent('liked-' + path);
}

function hasLiked() {
  try {
    const key = getLikeKey();
    const value = getItem(key);
    return value === 'true';
  } catch (e) {
    console.error('Nope...', e);
    return false;
  }
}

function like() {
  if (hasLiked()) {
    return;
  }

  try {
    const key = getLikeKey();
    setItem(key, 'true');
    showThanks();
    window.plausible('like', { props: { page: path } });
  } catch (e) {
    console.error('Nope...', e);
  }
}

if (hasLiked()) {
  showThanks();
} else {
  btn.addEventListener('click', like);
}

function showThanks() {
  btn.innerText = 'Thanks!';
  btn.disabled = true;
}

function getItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    // Local storage might be disabled in private windows.
    return sessionStorage.getItem(key);
  }
}

function setItem(key, value) {
  try {
    return localStorage.setItem(key, value);
  } catch (e) {
    // Local storage might be disabled in private windows.
    return sessionStorage.getItem(key, value);
  }
}
