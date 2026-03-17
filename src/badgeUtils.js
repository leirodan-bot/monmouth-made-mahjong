// ============================================================
// Badge / Award System for Monmouth Made Mah Jongg
// ============================================================

export const BADGES = [
  // === WINS ===
  { id: 'first_win', name: 'First Win', emoji: '🀄', category: 'Wins', desc: 'Win your first game', check: p => (p.wins || 0) >= 1 },
  { id: 'high_five', name: 'High Five', emoji: '🖐️', category: 'Wins', desc: 'Win 5 games', check: p => (p.wins || 0) >= 5 },
  { id: 'double_digits', name: 'Double Digits', emoji: '🔟', category: 'Wins', desc: 'Win 10 games', check: p => (p.wins || 0) >= 10 },
  { id: 'quarter_century', name: 'Quarter Century', emoji: '🏅', category: 'Wins', desc: 'Win 25 games', check: p => (p.wins || 0) >= 25 },
  { id: 'half_century', name: 'Half Century', emoji: '🥇', category: 'Wins', desc: 'Win 50 games', check: p => (p.wins || 0) >= 50 },
  { id: 'centurion', name: 'Centurion', emoji: '💯', category: 'Wins', desc: 'Win 100 games', check: p => (p.wins || 0) >= 100 },

  // === STREAKS ===
  { id: 'hot_hand', name: 'Hot Hand', emoji: '🔥', category: 'Streaks', desc: 'Win 3 games in a row', check: p => (p.best_streak || p.current_streak || 0) >= 3 },
  { id: 'on_fire', name: 'On Fire', emoji: '🔥🔥', category: 'Streaks', desc: 'Win 5 games in a row', check: p => (p.best_streak || p.current_streak || 0) >= 5 },
  { id: 'unstoppable', name: 'Unstoppable', emoji: '⚡', category: 'Streaks', desc: 'Win 10 games in a row', check: p => (p.best_streak || p.current_streak || 0) >= 10 },

  // === GAMES PLAYED ===
  { id: 'getting_started', name: 'Getting Started', emoji: '👋', category: 'Milestones', desc: 'Play your first game', check: p => (p.games_played || 0) >= 1 },
  { id: 'regular', name: 'Regular', emoji: '📅', category: 'Milestones', desc: 'Play 10 games', check: p => (p.games_played || 0) >= 10 },
  { id: 'dedicated', name: 'Dedicated', emoji: '💪', category: 'Milestones', desc: 'Play 25 games', check: p => (p.games_played || 0) >= 25 },
  { id: 'iron_player', name: 'Iron Player', emoji: '🦾', category: 'Milestones', desc: 'Play 50 games', check: p => (p.games_played || 0) >= 50 },
  { id: 'century_club', name: 'Century Club', emoji: '🏛️', category: 'Milestones', desc: 'Play 100 games', check: p => (p.games_played || 0) >= 100 },

  // === ELO / RANK ===
  { id: 'rank_skilled', name: 'Skilled', emoji: '🥉', category: 'Rank', desc: 'Reach Skilled tier (850 Elo)', check: p => (p.elo_peak || p.elo || 800) >= 850 },
  { id: 'rank_expert', name: 'Expert', emoji: '🥈', category: 'Rank', desc: 'Reach Expert tier (950 Elo)', check: p => (p.elo_peak || p.elo || 800) >= 950 },
  { id: 'rank_master', name: 'Master', emoji: '🥇', category: 'Rank', desc: 'Reach Master tier (1050 Elo)', check: p => (p.elo_peak || p.elo || 800) >= 1050 },
  { id: 'rank_grandmaster', name: 'Grandmaster', emoji: '👑', category: 'Rank', desc: 'Reach Grandmaster tier (1150 Elo)', check: p => (p.elo_peak || p.elo || 800) >= 1150 },

  // === COMMUNITY ===
  { id: 'club_member', name: 'Club Member', emoji: '🤝', category: 'Community', desc: 'Join a club', check: (p, extra) => (extra?.clubCount || 0) >= 1 },
  { id: 'social_butterfly', name: 'Social Butterfly', emoji: '🦋', category: 'Community', desc: 'Join 2 or more clubs', check: (p, extra) => (extra?.clubCount || 0) >= 2 },
  { id: 'town_hero', name: 'Town Hero', emoji: '🏘️', category: 'Community', desc: 'Be the #1 ranked player in your town', check: (p, extra) => extra?.isTopInTown },

  // === SPECIAL ===
  { id: 'wall_survivor', name: 'Wall Survivor', emoji: '🧱', category: 'Special', desc: 'Play 5 wall games', check: p => (p.wall_games || 0) >= 5 },
  { id: 'comeback_kid', name: 'Comeback Kid', emoji: '🔄', category: 'Special', desc: 'Win a game after 3+ losses in a row', check: (p, extra) => extra?.hadComeback },
  { id: 'pioneer', name: 'Pioneer', emoji: '🏔️', category: 'Special', desc: 'Among the first 50 players to join the league', check: (p, extra) => extra?.isFirst50 },
  { id: 'season_one_og', name: 'Season 1 OG', emoji: '⭐', category: 'Special', desc: 'Play at least 1 game in Season 1', check: p => (p.games_played || 0) >= 1 },
]

export const BADGE_CATEGORIES = ['Wins', 'Streaks', 'Milestones', 'Rank', 'Community', 'Special']

// Check which badges a player has earned
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
