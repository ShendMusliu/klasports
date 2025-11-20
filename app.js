const STORAGE_KEY = 'kla-volleyball-bracket';
const ACCESS_CODE = 'KLA-ADMIN';

const defaultState = {
  admin: false,
  seedNames: {
    game1Home: 'Teknika',
    game1Away: 'KLA',
    game2Home: 'PHS',
    game2Away: 'ILG',
  },
  times: {
    game1: '8:00 a.m.',
    game2: '',
    game3: '',
    game4: '',
    game5: '',
    game6: '',
  },
  scores: {
    game1Home: '',
    game1Away: '',
    game2Home: '',
    game2Away: '',
    game3Home: '',
    game3Away: '',
    game4Home: '',
    game4Away: '',
    game5Home: '',
    game5Away: '',
    game6Home: '',
    game6Away: '',
  },
  championPlayers: '',
  mvp: '',
};

const state = loadState();

const refs = {
  status: document.getElementById('statusMessage'),
  adminCode: document.getElementById('adminCode'),
  loginButton: document.getElementById('loginButton'),
  clearButton: document.getElementById('clearButton'),
  nameInputs: document.querySelectorAll('input[data-type="name"]'),
  timeInputs: document.querySelectorAll('input[data-type="time"]'),
  scoreInputs: document.querySelectorAll('input[data-type="score"]'),
  teamRows: document.querySelectorAll('.team'),
  championCard: document.getElementById('championCard'),
  championName: document.getElementById('championName'),
  championPlayersList: document.getElementById('championPlayersList'),
  addPlayerButton: document.getElementById('addPlayerButton'),
  mvpInput: document.getElementById('mvpName'),
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return clone(defaultState);
  try {
    const merged = { ...clone(defaultState), ...JSON.parse(saved) };
    if (!Array.isArray(merged.championPlayers)) {
      if (typeof merged.championPlayers === 'string') {
        merged.championPlayers = merged.championPlayers
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean);
      } else {
        merged.championPlayers = [];
      }
    }
    merged.mvp = merged.mvp || '';
    return merged;
  } catch {
    return clone(defaultState);
  }
}

function persistState() {
  const payload = { ...state };
  delete payload.admin;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function setStatus(message, type = 'info') {
  refs.status.textContent = message;
  refs.status.className = `status-message status-${type}`;
  setTimeout(() => {
    refs.status.textContent = '';
    refs.status.className = 'status-message';
  }, 4000);
}

function parseScore(value) {
  if (value === '' || value === null || typeof value === 'undefined') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function determineOutcome(gameKey, names) {
  const homeScore = parseScore(state.scores[`${gameKey}Home`]);
  const awayScore = parseScore(state.scores[`${gameKey}Away`]);
  if (homeScore === null || awayScore === null) {
    return { winner: null, loser: null, winnerSlot: null, loserSlot: null };
  }
  if (homeScore === awayScore) {
    return { winner: null, loser: null, winnerSlot: null, loserSlot: null };
  }
  if (homeScore > awayScore) {
    return { winner: names.home, loser: names.away, winnerSlot: 'home', loserSlot: 'away' };
  }
  return { winner: names.away, loser: names.home, winnerSlot: 'away', loserSlot: 'home' };
}

function computeBracketState() {
  const names = {
    game1: {
      home: state.seedNames.game1Home || 'Team 1',
      away: state.seedNames.game1Away || 'Team 2',
    },
    game2: {
      home: state.seedNames.game2Home || 'Team 3',
      away: state.seedNames.game2Away || 'Team 4',
    },
  };

  const outcomes = {};
  outcomes.game1 = determineOutcome('game1', names.game1);
  outcomes.game2 = determineOutcome('game2', names.game2);

  names.game3 = {
    home: outcomes.game1.winner || 'Winner Game 1',
    away: outcomes.game2.winner || 'Winner Game 2',
  };
  outcomes.game3 = determineOutcome('game3', names.game3);

  names.game4 = {
    home: outcomes.game1.loser || 'Loser Game 1',
    away: outcomes.game2.loser || 'Loser Game 2',
  };
  outcomes.game4 = determineOutcome('game4', names.game4);

  names.game5 = {
    home: outcomes.game4.winner || 'Winner Game 4',
    away: outcomes.game3.loser || 'Loser Game 3',
  };
  outcomes.game5 = determineOutcome('game5', names.game5);

  names.game6 = {
    home: outcomes.game3.winner || 'Winner Game 3',
    away: outcomes.game5.winner || 'Winner Game 5',
  };
  outcomes.game6 = determineOutcome('game6', names.game6);

  return { names, outcomes };
}

function render() {
  const { names, outcomes } = computeBracketState();

  refs.nameInputs.forEach((input) => {
    const { game, slot, derived } = input.dataset;
    if (derived === 'true') {
      input.value = names[game]?.[slot] ?? '';
    } else {
      const key = `${game}${slot === 'home' ? 'Home' : 'Away'}`;
      input.value = state.seedNames[key] ?? '';
    }
  });

  refs.timeInputs.forEach((input) => {
    input.value = state.times[input.dataset.game] ?? '';
  });

  refs.scoreInputs.forEach((input) => {
    const key = `${input.dataset.game}${input.dataset.slot === 'home' ? 'Home' : 'Away'}`;
    input.value = state.scores[key] ?? '';
  });

  refs.teamRows.forEach((row) => {
    row.classList.remove('team--winner', 'team--loser');
    const { game, slot } = row.dataset;
    const outcome = outcomes[game];
    if (!outcome) return;
    if (outcome.winnerSlot === slot) {
      row.classList.add('team--winner');
    } else if (outcome.loserSlot === slot) {
      row.classList.add('team--loser');
    }
  });

  const championName = outcomes.game6?.winner;
  if (championName) {
    refs.championCard.hidden = false;
    refs.championName.textContent = championName;
    renderChampionPlayersList();
    refs.addPlayerButton.disabled = !state.admin;
    refs.mvpInput.value = state.mvp;
    refs.mvpInput.disabled = !state.admin;
  } else {
    refs.championCard.hidden = true;
    refs.addPlayerButton.disabled = true;
    refs.mvpInput.value = '';
    refs.mvpInput.disabled = true;
  }
}

function renderChampionPlayersList() {
  if (!refs.championPlayersList) return;
  refs.championPlayersList.innerHTML = '';
  if (!state.championPlayers.length) {
    const empty = document.createElement('p');
    empty.className = 'players-empty';
    empty.textContent = 'Add player names to celebrate the champions.';
    refs.championPlayersList.appendChild(empty);
    return;
  }

  state.championPlayers.forEach((name, index) => {
    const row = document.createElement('div');
    row.className = 'team team--player';
    row.dataset.index = index;

    const seed = document.createElement('span');
    seed.className = 'seed';
    seed.textContent = index + 1;

    const input = document.createElement('input');
    input.className = 'team__name-input secured champion-player-input';
    input.placeholder = 'Player name';
    input.value = name;
    input.disabled = !state.admin;
    input.addEventListener('input', () => {
      state.championPlayers[index] = input.value;
      persistState();
    });

    row.append(seed, input);
    refs.championPlayersList.appendChild(row);
  });
}

function enableEditing() {
  document.querySelectorAll('.secured').forEach((input) => {
    input.disabled = false;
    if (input.dataset.derived === 'true') {
      input.readOnly = true;
    }
  });
}

function disableEditing() {
  document.querySelectorAll('.secured').forEach((input) => {
    input.disabled = true;
  });
}

function attachEvents() {
  function handleLogin(event) {
    event?.preventDefault();
    if (refs.adminCode.value.trim() === ACCESS_CODE) {
      state.admin = true;
      enableEditing();
      setStatus('Admin mode enabled', 'success');
      render();
    } else {
      setStatus('Invalid code', 'error');
    }
  }

  refs.loginButton.addEventListener('click', handleLogin);
  refs.adminCode.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      handleLogin(event);
    }
  });

  refs.clearButton.addEventListener('click', () => {
    if (!state.admin) {
      setStatus('Unlock admin mode to reset.', 'error');
      return;
    }
    if (confirm('Reset all names, times, and scores?')) {
      Object.assign(state.seedNames, clone(defaultState.seedNames));
      Object.assign(state.times, clone(defaultState.times));
      Object.assign(state.scores, clone(defaultState.scores));
      state.championPlayers = '';
      state.mvp = '';
      persistState();
      render();
    }
  });

  refs.nameInputs.forEach((input) => {
    if (input.dataset.derived === 'true') return;
    input.addEventListener('input', () => {
      const key = `${input.dataset.game}${input.dataset.slot === 'home' ? 'Home' : 'Away'}`;
      state.seedNames[key] = input.value.trim();
      persistState();
      render();
    });
  });

  refs.timeInputs.forEach((input) => {
    input.addEventListener('input', () => {
      state.times[input.dataset.game] = input.value;
      persistState();
    });
  });

  refs.scoreInputs.forEach((input) => {
    input.addEventListener('input', () => {
      const key = `${input.dataset.game}${input.dataset.slot === 'home' ? 'Home' : 'Away'}`;
      state.scores[key] = input.value;
      persistState();
      render();
    });
  });
  refs.addPlayerButton.addEventListener('click', () => {
    if (!state.admin) {
      setStatus('Unlock admin mode to edit players.', 'error');
      return;
    }
    state.championPlayers.push('');
    persistState();
    render();
  });

  refs.mvpInput.addEventListener('input', () => {
    state.mvp = refs.mvpInput.value;
    persistState();
  });
}

function init() {
  if (!state.admin) {
    disableEditing();
  } else {
    enableEditing();
  }
  render();
  attachEvents();
}

init();
