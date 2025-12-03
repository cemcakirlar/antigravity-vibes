import React from 'react'
import { GameState, GameOptions, CheatConfig } from '../game/types'

// Styles
const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontFamily: 'monospace',
    zIndex: 10
}

const titleStyle: React.CSSProperties = {
    fontSize: '64px',
    marginBottom: '40px',
    textShadow: '0 0 20px #0ff, 0 0 40px #0ff',
    letterSpacing: '4px'
}

const buttonStyle: React.CSSProperties = {
    padding: '15px 40px',
    fontSize: '24px',
    backgroundColor: 'transparent',
    border: '2px solid #0ff',
    color: '#0ff',
    cursor: 'pointer',
    fontFamily: 'monospace',
    transition: 'all 0.2s',
    textShadow: '0 0 5px #0ff',
    boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
    marginBottom: '20px'
}

const optionRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    width: '500px',
    marginBottom: '15px',
    fontSize: '20px',
    alignItems: 'center'
}

const optionButtonStyle: React.CSSProperties = {
    padding: '5px 15px',
    backgroundColor: 'transparent',
    border: '1px solid #fff',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: 'monospace',
    width: '200px',
    textAlign: 'center'
}

// Main Menu
interface MainMenuProps {
    startGame: () => void
    setShowGuide: (show: boolean) => void
    setShowOptions: (show: boolean) => void
    setShowCheats: (show: boolean) => void
    options: GameOptions
}

export const MainMenu: React.FC<MainMenuProps> = ({ startGame, setShowGuide, setShowOptions, setShowCheats, options }) => (
    <div style={overlayStyle}>
        <h1 style={titleStyle}>NEON VORTEX</h1>
        <button onClick={startGame} style={buttonStyle}>START GAME</button>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <button onClick={() => setShowGuide(true)} style={{ ...buttonStyle, fontSize: '18px' }}>GUIDE</button>
            <button onClick={() => setShowOptions(true)} style={{ ...buttonStyle, fontSize: '18px' }}>OPTIONS</button>
            <button onClick={() => setShowCheats(true)} style={{ ...buttonStyle, fontSize: '18px', borderColor: '#ff00ff', color: '#ff00ff', boxShadow: '0 0 15px rgba(255, 0, 255, 0.3)' }}>CHEATS</button>
        </div>
        <p style={{ marginTop: '40px', color: '#888', fontSize: '16px' }}>
            {options.movementMode === 'RECOIL'
                ? 'Mouse to Aim • Click to Shoot • Recoil to Move'
                : 'WASD to Move • Mouse/Space to Shoot'}
        </p>
    </div>
)

// Pause Menu
interface PauseMenuProps {
    resumeGame: () => void
    exitToMenu: () => void
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ resumeGame, exitToMenu }) => (
    <div style={overlayStyle}>
        <h1 style={titleStyle}>PAUSED</h1>
        <button onClick={resumeGame} style={buttonStyle}>RESUME</button>
        <button onClick={exitToMenu} style={{ ...buttonStyle, marginTop: '20px', borderColor: '#fff', color: '#fff', boxShadow: 'none' }}>EXIT TO MENU</button>
    </div>
)

// Game Over Menu
interface GameOverMenuProps {
    score: number
    highScore: number
    restartGame: () => void
    exitToMenu: () => void
}

export const GameOverMenu: React.FC<GameOverMenuProps> = ({ score, highScore, restartGame, exitToMenu }) => (
    <div style={overlayStyle}>
        <h1 style={{ ...titleStyle, color: '#f00', textShadow: '0 0 20px #f00' }}>GAME OVER</h1>
        <div style={{ fontSize: '32px', marginBottom: '20px' }}>FINAL SCORE: {score}</div>
        {score >= highScore && score > 0 && (
            <div style={{ fontSize: '24px', color: '#ff0', marginBottom: '40px', animation: 'pulse 1s infinite' }}>NEW HIGH SCORE!</div>
        )}
        <button onClick={restartGame} style={buttonStyle}>TRY AGAIN</button>
        <button onClick={exitToMenu} style={{ ...buttonStyle, marginTop: '20px', borderColor: '#fff', color: '#fff', boxShadow: 'none' }}>EXIT TO MENU</button>
    </div>
)

// Guide Overlay
interface GuideOverlayProps {
    setShowGuide: (show: boolean) => void
}

export const GuideOverlay: React.FC<GuideOverlayProps> = ({ setShowGuide }) => (
    <div style={{ ...overlayStyle, justifyContent: 'flex-start', paddingTop: '40px' }}>
        <h2 style={{ ...titleStyle, fontSize: '48px', marginBottom: '20px' }}>GAME GUIDE</h2>

        <div style={{ display: 'flex', gap: '40px', maxWidth: '1000px', width: '100%', padding: '20px' }}>
            {/* Enemies */}
            <div style={{ flex: 1 }}>
                <h3 style={{ color: '#0ff', borderBottom: '2px solid #0ff', paddingBottom: '10px' }}>ENEMIES</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', textAlign: 'left' }}>
                    <div>
                        <span style={{ color: '#f00', fontWeight: 'bold' }}>RED (Normal):</span> Chases you. Basic enemy.
                    </div>
                    <div>
                        <span style={{ color: '#ff0', fontWeight: 'bold' }}>YELLOW (Dasher):</span> Fast! Dashes towards you.
                    </div>
                    <div>
                        <span style={{ color: '#0f0', fontWeight: 'bold' }}>GREEN (Shooter):</span> Shoots bullets at you.
                    </div>
                    <div>
                        <span style={{ color: '#f0f', fontWeight: 'bold' }}>PURPLE (Tank):</span> High HP. Spawns particles.
                    </div>
                </div>
            </div>

            {/* Power-ups */}
            <div style={{ flex: 1 }}>
                <h3 style={{ color: '#ff0', borderBottom: '2px solid #ff0', paddingBottom: '10px' }}>POWER-UPS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', textAlign: 'left' }}>
                    <div>
                        <span style={{ color: '#0ff', fontWeight: 'bold' }}>🛡️ SHIELD:</span> Invincibility. Destroys enemies on contact.
                    </div>
                    <div>
                        <span style={{ color: '#f90', fontWeight: 'bold' }}>⚡ RAPID FIRE:</span> Shoot much faster.
                    </div>
                    <div>
                        <span style={{ color: '#f0f', fontWeight: 'bold' }}>💥 SPREAD SHOT:</span> Shoot 3 bullets at once.
                    </div>
                </div>
            </div>
        </div>

        <div style={{ marginTop: '20px', fontSize: '18px', color: '#aaa' }}>
            <p>Tip: You can collect power-ups by shooting them!</p>
        </div>

        <button onClick={() => setShowGuide(false)} style={{ ...buttonStyle, marginTop: '40px' }}>CLOSE</button>
    </div>
)

// Options Overlay
interface OptionsOverlayProps {
    options: GameOptions
    setOptions: (options: GameOptions) => void
    setShowOptions: (show: boolean) => void
    DEFAULT_OPTIONS: GameOptions
}

export const OptionsOverlay: React.FC<OptionsOverlayProps> = ({ options, setOptions, setShowOptions, DEFAULT_OPTIONS }) => {
    const toggleWallMode = () => setOptions({ ...options, wallMode: options.wallMode === 'DIE' ? 'BOUNCE' : 'DIE' })
    const toggleGameMode = () => {
        const modes: GameOptions['gameMode'][] = ['NORMAL', 'INFINITE', 'SURVIVAL']
        const next = modes[(modes.indexOf(options.gameMode) + 1) % modes.length]
        setOptions({ ...options, gameMode: next })
    }
    const toggleSurvivalThreshold = () => {
        const thresholds = [10, 20, 30, 40, 50]
        const currentThreshold = options.survivalThreshold ?? thresholds[0]
        const next = thresholds[(thresholds.indexOf(currentThreshold) + 1) % thresholds.length]
        setOptions({ ...options, survivalThreshold: next })
    }
    const toggleEnemySpeed = () => {
        setOptions({ ...options, enemySpeed: options.enemySpeed === 'SLOW' ? 'NORMAL' : options.enemySpeed === 'NORMAL' ? 'FAST' : 'SLOW' })
    }
    const toggleMovementMode = () => setOptions({ ...options, movementMode: options.movementMode === 'RECOIL' ? 'WASD' : 'RECOIL' })
    const toggleSound = () => setOptions({ ...options, soundEnabled: !options.soundEnabled })
    const toggleAutoFire = () => setOptions({ ...options, autoFire: !options.autoFire })
    const toggleDifficulty = () => {
        setOptions({ ...options, difficulty: options.difficulty === 'EASY' ? 'NORMAL' : options.difficulty === 'NORMAL' ? 'HARD' : 'EASY' })
    }
    const resetToDefaults = () => setOptions(DEFAULT_OPTIONS)

    return (
        <div style={overlayStyle}>
            <h2 style={{ ...titleStyle, fontSize: '48px', marginBottom: '30px' }}>OPTIONS</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={optionRowStyle}>
                    <span>WALL MODE:</span>
                    <button onClick={toggleWallMode} style={optionButtonStyle}>{options.wallMode}</button>
                </div>

                <div style={optionRowStyle}>
                    <span>GAME MODE:</span>
                    <button onClick={toggleGameMode} style={optionButtonStyle}>{options.gameMode}</button>
                </div>

                {options.gameMode === 'SURVIVAL' && (
                    <div style={optionRowStyle}>
                        <span>SURVIVAL LIMIT (DPM):</span>
                        <button onClick={toggleSurvivalThreshold} style={optionButtonStyle}>{options.survivalThreshold}</button>
                    </div>
                )}

                <div style={optionRowStyle}>
                    <span>ENEMY SPEED:</span>
                    <button onClick={toggleEnemySpeed} style={optionButtonStyle}>{options.enemySpeed}</button>
                </div>

                <div style={optionRowStyle}>
                    <span>MOVEMENT:</span>
                    <button onClick={toggleMovementMode} style={optionButtonStyle}>{options.movementMode}</button>
                </div>

                <div style={optionRowStyle}>
                    <span>SOUND:</span>
                    <button onClick={toggleSound} style={optionButtonStyle}>{options.soundEnabled ? 'ON' : 'OFF'}</button>
                </div>

                <div style={optionRowStyle}>
                    <span>AUTO FIRE:</span>
                    <button onClick={toggleAutoFire} style={optionButtonStyle}>{options.autoFire ? 'ON' : 'OFF'}</button>
                </div>

                <div style={optionRowStyle}>
                    <span>DIFFICULTY:</span>
                    <button onClick={toggleDifficulty} style={optionButtonStyle}>{options.difficulty}</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <button onClick={resetToDefaults} style={{ ...buttonStyle, fontSize: '18px', borderColor: '#f00', color: '#f00' }}>RESET DEFAULTS</button>
                <button onClick={() => setShowOptions(false)} style={buttonStyle}>CLOSE</button>
            </div>
        </div>
    )
}

// Cheat Overlay
interface CheatOverlayProps {
    cheats: CheatConfig
    setCheats: (cheats: CheatConfig) => void
    setShowCheats: (show: boolean) => void
    saveCheats: () => void
    resetCheats: () => void
}

export const CheatOverlay: React.FC<CheatOverlayProps> = ({ cheats, setCheats, setShowCheats, saveCheats, resetCheats }) => (
    <div style={overlayStyle}>
        <h2 style={{ ...titleStyle, fontSize: '48px', marginBottom: '30px', color: '#ff00ff', textShadow: '0 0 20px #ff00ff' }}>CHEAT MENU</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={optionRowStyle}>
                <span style={{ fontSize: '20px' }}>SPAWN RATE (Frames): {cheats.enemySpawnRate}</span>
                <input
                    type="range"
                    min="10"
                    max="120"
                    value={cheats.enemySpawnRate}
                    onChange={(e) => setCheats({ ...cheats, enemySpawnRate: parseInt(e.target.value) })}
                    style={{ width: '200px' }}
                />
            </div>

            <div style={optionRowStyle}>
                <span style={{ fontSize: '20px' }}>POWER-UP CHANCE: {Math.round(cheats.powerUpChance * 100)}%</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={cheats.powerUpChance * 100}
                    onChange={(e) => setCheats({ ...cheats, powerUpChance: parseInt(e.target.value) / 100 })}
                    style={{ width: '200px' }}
                />
            </div>

            <div style={optionRowStyle}>
                <span style={{ fontSize: '20px' }}>ENEMY SPEED: {cheats.enemySpeedMultiplier.toFixed(1)}x</span>
                <input
                    type="range"
                    min="1"
                    max="30"
                    value={cheats.enemySpeedMultiplier * 10}
                    onChange={(e) => setCheats({ ...cheats, enemySpeedMultiplier: parseInt(e.target.value) / 10 })}
                    style={{ width: '200px' }}
                />
            </div>

            <div style={optionRowStyle}>
                <span style={{ fontSize: '20px' }}>SURVIVAL LIMIT: {cheats.survivalThresholdOverride ?? 'DEFAULT'}</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={cheats.survivalThresholdOverride ?? 0}
                    onChange={(e) => {
                        const val = parseInt(e.target.value)
                        setCheats({ ...cheats, survivalThresholdOverride: val === 0 ? null : val })
                    }}
                    style={{ width: '200px' }}
                />
            </div>
            <div style={{ fontSize: '14px', color: '#888', marginTop: '-15px', textAlign: 'right' }}>0 = Use Option Default</div>

            <div style={optionRowStyle}>
                <span style={{ fontSize: '20px' }}>GOD MODE:</span>
                <button
                    onClick={() => setCheats({ ...cheats, godMode: !cheats.godMode })}
                    style={{ ...optionButtonStyle, color: cheats.godMode ? '#0f0' : '#f00', borderColor: cheats.godMode ? '#0f0' : '#f00' }}
                >
                    {cheats.godMode ? 'ENABLED' : 'DISABLED'}
                </button>
            </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
            <button onClick={saveCheats} style={{ ...buttonStyle, fontSize: '16px', borderColor: '#0f0', color: '#0f0' }}>SAVE</button>
            <button onClick={resetCheats} style={{ ...buttonStyle, fontSize: '16px', borderColor: '#f00', color: '#f00' }}>RESET</button>
            <button onClick={() => setShowCheats(false)} style={{ ...buttonStyle, borderColor: '#ff00ff', color: '#ff00ff' }}>CLOSE</button>
        </div>
    </div>
)
