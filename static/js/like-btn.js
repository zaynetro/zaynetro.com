const path = readLocation();
const btn = document.querySelector('#like-btn');

function readLocation() {
  const p = location.pathname;
  if (p.endsWith('/')) {
    return p;
  } else {
    return p + '/';
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
  } catch (_e) {
    // Local storage might be disabled in private windows.
    return sessionStorage.getItem(key);
  }
}

function setItem(key, value) {
  try {
    return localStorage.setItem(key, value);
  } catch (_e) {
    // Local storage might be disabled in private windows.
    return sessionStorage.getItem(key, value);
  }
}

function getPollBtnKey(btn) {
  return encodeURIComponent('voted-' + btn.dataset.pollid + '-' + btn.innerText);
}

function hasVoted(btn) {
  try {
    const key = getPollBtnKey(btn);
    const value = getItem(key);
    return value === 'true';
  } catch (e) {
    console.error('Nope...', e);
    return false;
  }
}

const pollButtons = document.querySelectorAll('.poll button');
pollButtons.forEach((btn) => {
  if (hasVoted(btn)) {
    showVotedText(btn);
  } else {
    btn.addEventListener('click', () => {
      try {
        const key = getPollBtnKey(btn);
        setItem(key, 'true');
        showVotedText(btn);
        window.plausible(btn.dataset.pollid, { props: { page: path, answer: btn.innerText } });
      } catch (e) {
        console.error('Nope...', e);
      }
    });
  }
});

function showVotedText(btn) {
  btn.parentElement.classList.add('voted');
  btn.parentElement.innerText = btn.innerText;
}
