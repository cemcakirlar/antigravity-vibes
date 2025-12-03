export enum GameState {
    MENU = 'MENU',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    GAMEOVER = 'GAMEOVER'
}

export interface GameOptions {
    wallMode: 'DIE' | 'BOUNCE'
    gameMode: 'NORMAL' | 'INFINITE' | 'SURVIVAL'
    enemySpeed: 'SLOW' | 'NORMAL' | 'FAST'
    movementMode: 'RECOIL' | 'WASD'
    soundEnabled: boolean
    autoFire: boolean
    difficulty: 'EASY' | 'NORMAL' | 'HARD'
    survivalThreshold: number
}

export interface CheatConfig {
    enemySpawnRate: number
    powerUpChance: number
    enemySpeedMultiplier: number
    godMode: boolean
    survivalThresholdOverride: number | null
}
