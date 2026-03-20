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
const G = 120         // Games threshold for K-factor floor
const RATING_FLOOR = 500
const STARTING_ELO = 800
const PROVISIONAL_THRESHOLD = 5  // Games before appearing on leaderboard
const INACTIVITY_DAYS = 60

// ── Tier Definitions (from spec Table 6) ──
export const TIERS = [
  { name: 'Novice',       min: 0,    max: 699,  color: '#6b7280', bg: '#6b7280', textColor: 'white' },
  { name: 'Beginner',     min: 700,  max: 799,  color: '#b8860b', bg: '#cd7f32', textColor: 'white' },
  { name: 'Skilled',      min: 800,  max: 899,  color: '#71717a', bg: '#a8a8a8', textColor: 'white' },
  { name: 'Expert',       min: 900,  max: 999,  color: '#b8860b', bg: '#d4a745', textColor: 'white' },
  { name: 'Master',       min: 1000, max: 1099, color: '#6b7280', bg: '#8b95a5', textColor: 'white' },
  { name: 'Grandmaster',  min: 1100, max: 99999, color: '#1e2b65', bg: '#1e2b65', textColor: '#f0c040' },
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
export function getKFactor(ratedGames, seasonalGames = 999) {
  const baseK = ratedGames >= G
    ? K_MIN
    : Math.max(K_MIN, 1 - (1 - K_MIN) * (ratedGames / G))

  // Post-season boost: floor at 0.4 for first 10 rated games of season
  if (seasonalGames < 10) {
    return Math.max(baseK, 0.4)
  }
  return baseK
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
export function calculateEloUpdate(playerRating, ratedGames, opponentRatings, isWinner, isWallGame = false, seasonalGames = 999) {
  if (isWallGame) {
    return { delta: 0, newRating: playerRating, kFactor: getKFactor(ratedGames, seasonalGames) }
  }

  const avgOpponentRating = opponentRatings.reduce((sum, r) => sum + r, 0) / opponentRatings.length
  const placementBase = isWinner ? PLACEMENT_WIN : PLACEMENT_LOSE

  // v2.0: Cap rating gap at ±400
  const rawGap = avgOpponentRating - playerRating
  const clampedGap = Math.max(-400, Math.min(400, rawGap))
  const gapAdjustment = clampedGap / D

  const k = getKFactor(ratedGames, seasonalGames)
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
      player.elo_rated_games || player.games_played || 0,
      opponentRatings,
      isWinner,
      isWallGame,
      player.elo_seasonal_games || 999
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
