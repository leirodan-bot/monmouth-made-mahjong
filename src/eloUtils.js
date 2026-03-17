/**
 * Monmouth Made Mah Jongg™ — Elo Rating System
 * Based on Tenhou.net's 4-player Elo adaptation
 * See: MMM_Elo_Spec.docx v1.0 (March 2026)
 */

// ── Constants ──
const PLACEMENT_WIN = 30
const PLACEMENT_LOSE = -10
const D = 40          // Divisor for rating gap adjustment
const K_MIN = 0.2     // Minimum K-factor (veteran players)
const G = 80          // Games threshold for K-factor floor
const RATING_FLOOR = 500
const STARTING_ELO = 800
const PROVISIONAL_THRESHOLD = 5  // Games before appearing on leaderboard
const INACTIVITY_DAYS = 60

// ── Tier Definitions (from spec Table 6) ──
export const TIERS = [
  { name: 'Novice',       min: 0,    max: 749,  color: '#6b7280', bg: '#6b7280', textColor: 'white' },
  { name: 'Beginner',     min: 750,  max: 849,  color: '#b8860b', bg: '#cd7f32', textColor: 'white' },
  { name: 'Skilled',      min: 850,  max: 949,  color: '#71717a', bg: '#a8a8a8', textColor: 'white' },
  { name: 'Expert',       min: 950,  max: 1049, color: '#b8860b', bg: '#d4a745', textColor: 'white' },
  { name: 'Master',       min: 1050, max: 1149, color: '#6b7280', bg: '#8b95a5', textColor: 'white' },
  { name: 'Grandmaster',  min: 1150, max: 99999, color: '#1a2744', bg: '#1a2744', textColor: '#f0c040' },
]

/**
 * Get tier info for a given Elo rating
 */
export function getTier(elo) {
  return TIERS.find(t => elo >= t.min && elo <= t.max) || TIERS[0]
}

/**
 * Calculate K-factor using Tenhou's decay function
 * K = max(K_MIN, 1 - (1 - K_MIN) * (games_played / G))
 */
export function getKFactor(gamesPlayed) {
  if (gamesPlayed >= G) return K_MIN
  return Math.max(K_MIN, 1 - (1 - K_MIN) * (gamesPlayed / G))
}

/**
 * Calculate Elo update for a single player after a game
 * 
 * Formula: Rating_change = K × (Placement_base + (Avg_opponent_rating - Own_rating) / D)
 * 
 * @param {number} playerRating - Player's current Elo
 * @param {number} gamesPlayed - Player's total verified games (before this game)
 * @param {number[]} opponentRatings - Array of opponent ratings (2 or 3 opponents)
 * @param {boolean} isWinner - Whether this player won
 * @param {boolean} isWallGame - Whether the game ended as a wall game
 * @returns {{ delta: number, newRating: number, kFactor: number }}
 */
export function calculateEloUpdate(playerRating, gamesPlayed, opponentRatings, isWinner, isWallGame = false) {
  // Wall games: no rating change, but games_played still increments
  if (isWallGame) {
    return { delta: 0, newRating: playerRating, kFactor: getKFactor(gamesPlayed) }
  }

  const avgOpponentRating = opponentRatings.reduce((sum, r) => sum + r, 0) / opponentRatings.length
  const placementBase = isWinner ? PLACEMENT_WIN : PLACEMENT_LOSE
  const gapAdjustment = (avgOpponentRating - playerRating) / D
  const k = getKFactor(gamesPlayed)
  const delta = k * (placementBase + gapAdjustment)
  const newRating = Math.max(RATING_FLOOR, playerRating + delta)

  return {
    delta: Math.round((newRating - playerRating) * 10) / 10,
    newRating: Math.round(newRating * 10) / 10,
    kFactor: Math.round(k * 100) / 100
  }
}

/**
 * Calculate all Elo updates for a complete game
 * 
 * @param {Array<{id: string, elo: number, games_played: number}>} players - All players at the table (3 or 4)
 * @param {string|null} winnerId - ID of the winner (null for wall game)
 * @returns {Array<{id: string, delta: number, newRating: number, kFactor: number, ratingBefore: number}>}
 */
export function calculateGameEloUpdates(players, winnerId) {
  const isWallGame = winnerId === null

  return players.map(player => {
    const opponents = players.filter(p => p.id !== player.id)
    const opponentRatings = opponents.map(o => o.elo)
    const isWinner = player.id === winnerId

    const result = calculateEloUpdate(
      player.elo,
      player.games_played,
      opponentRatings,
      isWinner,
      isWallGame
    )

    return {
      id: player.id,
      ratingBefore: player.elo,
      ...result
    }
  })
}

/**
 * Determine rank tier name from Elo
 */
export function getRankTierName(elo) {
  return getTier(elo).name
}

/**
 * Check if a player is provisional (< 5 verified games)
 */
export function isProvisional(gamesPlayed) {
  return gamesPlayed < PROVISIONAL_THRESHOLD
}

/**
 * Check if a player is inactive (no game in 60+ days)
 */
export function isInactive(lastGameDate) {
  if (!lastGameDate) return false
  const daysSince = (Date.now() - new Date(lastGameDate).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince >= INACTIVITY_DAYS
}

/**
 * Calculate new season rating (soft reset)
 * New_season_rating = 800 + 0.6 × (Old_rating - 800)
 */
export function seasonReset(currentRating) {
  return Math.round((STARTING_ELO + 0.6 * (currentRating - STARTING_ELO)) * 10) / 10
}

export { STARTING_ELO, RATING_FLOOR, PROVISIONAL_THRESHOLD, INACTIVITY_DAYS, K_MIN, G, D }
