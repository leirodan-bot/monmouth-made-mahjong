/**
 * MahjRank™ — Elo Rating System v2.1
 * Based on Tenhou.net's 4-player Elo adaptation
 * See: MahjRank_Elo_Spec_v2.1.docx (March 2026)
 */

// ── Constants ──
const PLACEMENT_WIN = 30
const PLACEMENT_LOSE = -10
const D = 40
const K_MIN = 0.2
const G = 120
const RATING_FLOOR = 500
const STARTING_ELO = 800
const PROVISIONAL_THRESHOLD = 5
const INACTIVITY_DAYS = 60

// ── Tier Definitions (v2.1 thresholds) ──
export const TIERS = [
  { name: 'Novice',       min: 0,    max: 749,   color: '#6b7280', bg: '#6b7280', textColor: 'white' },
  { name: 'Beginner',     min: 750,  max: 849,   color: '#CD7F32', bg: '#CD7F32', textColor: 'white' },
  { name: 'Skilled',      min: 850,  max: 949,   color: '#94a3b8', bg: '#94a3b8', textColor: 'white' },
  { name: 'Expert',       min: 950,  max: 1049,  color: '#F59E0B', bg: '#F59E0B', textColor: 'white' },
  { name: 'Master',       min: 1050, max: 1149,  color: '#64748B', bg: '#64748B', textColor: 'white' },
  { name: 'Grandmaster',  min: 1150, max: 99999, color: '#0F172A', bg: '#0F172A', textColor: '#F59E0B' },
]

export function getTier(elo) {
  return TIERS.find(t => elo >= t.min && elo <= t.max) || TIERS[0]
}

export function getKFactor(ratedGames, seasonalGames = 999) {
  const baseK = ratedGames >= G
    ? K_MIN
    : Math.max(K_MIN, 1 - (1 - K_MIN) * (ratedGames / G))

  if (seasonalGames < 10) {
    return Math.max(baseK, 0.4)
  }
  return baseK
}

export function calculateEloUpdate(playerRating, ratedGames, opponentRatings, isWinner, isWallGame = false, seasonalGames = 999) {
  if (isWallGame) {
    return { delta: 0, newRating: playerRating, kFactor: getKFactor(ratedGames, seasonalGames) }
  }

  const avgOpponentRating = opponentRatings.reduce((sum, r) => sum + r, 0) / opponentRatings.length
  const placementBase = isWinner ? PLACEMENT_WIN : PLACEMENT_LOSE

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

export function getRankTierName(elo) {
  return getTier(elo).name
}

export function isProvisional(gamesPlayed) {
  return gamesPlayed < PROVISIONAL_THRESHOLD
}

export function isInactive(lastGameDate) {
  if (!lastGameDate) return false
  const daysSince = (Date.now() - new Date(lastGameDate).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince >= INACTIVITY_DAYS
}

export function seasonReset(currentRating) {
  return Math.round((STARTING_ELO + 0.6 * (currentRating - STARTING_ELO)) * 10) / 10
}

export { STARTING_ELO, RATING_FLOOR, PROVISIONAL_THRESHOLD, INACTIVITY_DAYS, K_MIN, G, D }