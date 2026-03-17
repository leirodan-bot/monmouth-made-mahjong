// ============================================================
// Badge / Award System — Monmouth Made Mah Jongg
// Matches the original 27-badge spec exactly
// ============================================================

export const BADGES = [
  // === LEGACY (from signup date) ===
  { id: 'og_50', name: 'OG 50', emoji: '🏔️', category: 'Legacy', desc: 'Among the first 50 players to join the league', check: (p, extra) => extra?.isFirst50 },
  { id: 'pioneer', name: 'Pioneer', emoji: '🚀', category: 'Legacy', desc: 'Joined during the first month of the league', check: (p, extra) => extra?.joinedFirstMonth },
  { id: 'charter_member', name: 'Charter Member', emoji: '📜', category: 'Legacy', desc: 'Joined during the first 3 months of the league', check: (p, extra) => extra?.joinedFirst3Months },

  // === WINS (from win count) ===
  { id: 'first_blood', name: 'First Blood', emoji: '🀄', category: 'Wins', desc: 'Win your first game', check: p => (p.wins || 0) >= 1 },
  { id: 'double_digits', name: 'Double Digits', emoji: '🔟', category: 'Wins', desc: 'Win 10 games', check: p => (p.wins || 0) >= 10 },
  { id: 'quarter_century', name: 'Quarter Century', emoji: '🏅', category: 'Wins', desc: 'Win 25 games', check: p => (p.wins || 0) >= 25 },
  { id: 'half_century', name: 'Half Century', emoji: '🥇', category: 'Wins', desc: 'Win 50 games', check: p => (p.wins || 0) >= 50 },
  { id: 'centurion', name: 'Centurion', emoji: '💯', category: 'Wins', desc: 'Win 100 games', check: p => (p.wins || 0) >= 100 },

  // === STREAKS (from consecutive wins) ===
  { id: 'hot_hand', name: 'Hot Hand', emoji: '🔥', category: 'Streaks', desc: 'Win 3 games in a row', check: p => (p.best_streak || p.current_streak || 0) >= 3 },
  { id: 'on_fire', name: 'On Fire', emoji: '🔥🔥', category: 'Streaks', desc: 'Win 5 games in a row', check: p => (p.best_streak || p.current_streak || 0) >= 5 },
  { id: 'unstoppable', name: 'Unstoppable', emoji: '⚡', category: 'Streaks', desc: 'Win 10 games in a row', check: p => (p.best_streak || p.current_streak || 0) >= 10 },

  // === CONSISTENCY (from game timestamps) ===
  { id: 'regular', name: 'Regular', emoji: '📅', category: 'Consistency', desc: 'Play 3 games in one week', check: (p, extra) => extra?.gamesThisWeek >= 3 },
  { id: 'dedicated', name: 'Dedicated', emoji: '💪', category: 'Consistency', desc: 'Play 3+ games per week for 4 weeks straight', check: (p, extra) => extra?.dedicatedWeeks >= 4 },
  { id: 'iron_player', name: 'Iron Player', emoji: '🦾', category: 'Consistency', desc: 'Play 1+ game every week for 3 months', check: (p, extra) => extra?.consecutiveWeeks >= 12 },

  // === GAMES PLAYED (from total games) ===
  { id: 'getting_started', name: 'Getting Started', emoji: '👋', category: 'Games Played', desc: 'Play 10 games', check: p => (p.games_played || 0) >= 10 },
  { id: 'veteran', name: 'Veteran', emoji: '🎖️', category: 'Games Played', desc: 'Play 50 games', check: p => (p.games_played || 0) >= 50 },
  { id: 'lifer', name: 'Lifer', emoji: '🏛️', category: 'Games Played', desc: 'Play 100 games', check: p => (p.games_played || 0) >= 100 },

  // === COMMUNITY (from location + opponent data) ===
  { id: 'club_hopper', name: 'Club Hopper', emoji: '🦋', category: 'Community', desc: 'Play at 3 or more clubs', check: (p, extra) => (extra?.uniqueClubs || 0) >= 3 },
  { id: 'rival', name: 'Rival', emoji: '⚔️', category: 'Community', desc: 'Play the same opponent 10 times', check: (p, extra) => extra?.hasRival },
  { id: 'welcome_wagon', name: 'Welcome Wagon', emoji: '🤝', category: 'Community', desc: 'Be the first to play a brand new member', check: (p, extra) => extra?.welcomedNewbie },
  { id: 'globetrotter', name: 'Globetrotter', emoji: '🌍', category: 'Community', desc: 'Play at 5 or more locations', check: (p, extra) => (extra?.uniqueLocations || 0) >= 5 },
  { id: 'table_captain', name: 'Table Captain', emoji: '🪑', category: 'Community', desc: 'Host 10 home games', check: (p, extra) => (extra?.homeGamesHosted || 0) >= 10 },

  // === RANKINGS (from Elo leaderboard position) ===
  { id: 'top_10', name: 'Top 10', emoji: '🏆', category: 'Rankings', desc: 'Reach the top 10 on the leaderboard', check: (p, extra) => (extra?.rank || 999) <= 10 },
  { id: 'podium', name: 'Podium', emoji: '🥉', category: 'Rankings', desc: 'Reach the top 3 on the leaderboard', check: (p, extra) => (extra?.rank || 999) <= 3 },
  { id: 'number_one', name: 'Number One', emoji: '👑', category: 'Rankings', desc: 'Reach #1 on the leaderboard', check: (p, extra) => (extra?.rank || 999) === 1 },

  // === MAHJONG SPECIALS (from win details) ===
  { id: 'jokerless', name: 'Jokerless', emoji: '🃏', category: 'Mahjong Specials', desc: 'Win a game with no jokers', check: (p, extra) => extra?.hasJokerlessWin },
  { id: 'concealed_victory', name: 'Concealed Victory', emoji: '🙈', category: 'Mahjong Specials', desc: 'Win with 0 exposures (concealed hand)', check: (p, extra) => extra?.hasConcealedWin },
  { id: 'new_card_no_problem', name: 'New Card, No Problem', emoji: '🃏✨', category: 'Mahjong Specials', desc: 'First win after April 1 (new NMJL card year)', check: (p, extra) => extra?.hasNewCardWin },
]

export const BADGE_CATEGORIES = ['Legacy', 'Wins', 'Streaks', 'Consistency', 'Games Played', 'Community', 'Rankings', 'Mahjong Specials']

// Check which badges a player has earned
// `extra` is populated by the caller with data from queries
export function checkBadges(player, extra = {}) {
  return BADGES.filter(b => b.check(player, extra)).map(b => b.id)
}

// Get badge def by id
export function getBadge(id) {
  return BADGES.find(b => b.id === id)
}

// Find newly earned badges (compare old list to new)
export function getNewBadges(oldBadgeIds, newBadgeIds) {
  return newBadgeIds.filter(id => !oldBadgeIds.includes(id))
}
