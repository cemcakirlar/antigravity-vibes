import { useEffect, useRef, useState } from 'react'
import { GameEngine, GameState, GameOptions, CheatConfig } from '../game/Engine'

export function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<GameEngine | null>(null)

    const [gameState, setGameState] = useState<GameState>(GameState.MENU)
    const [score, setScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [dpm, setDpm] = useState(0)
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem('neon-vortex-highscore')
        return saved ? parseInt(saved) : 0
    })

    useEffect(() => {
        if (score > highScore) {
            setHighScore(score)
            localStorage.setItem('neon-vortex-highscore', score.toString())
        }
    }, [score, highScore])

    const DEFAULT_OPTIONS: GameOptions = {
        wallMode: 'BOUNCE',
        gameMode: 'INFINITE',
        enemySpeed: 'SLOW',
        movementMode: 'WASD',
        soundEnabled: true,
        autoFire: false,
        difficulty: 'NORMAL',
        survivalThreshold: 30
    }

    const [options, setOptions] = useState<GameOptions>(() => {
        const saved = localStorage.getItem('neon-vortex-options')
        return saved ? { ...DEFAULT_OPTIONS, ...JSON.parse(saved) } : DEFAULT_OPTIONS
    })
    const [showOptions, setShowOptions] = useState(false)
    const [showGuide, setShowGuide] = useState(false)
    const [showCheats, setShowCheats] = useState(false)

    const [cheats, setCheats] = useState<CheatConfig>({
        enemySpawnRate: 60,
        powerUpChance: 0.3,
        enemySpeedMultiplier: 1.0,
        godMode: false,
        survivalThresholdOverride: null
    })

    // Load cheats from local storage
    useEffect(() => {
        const savedCheats = localStorage.getItem('neon-vortex-cheats')
        if (savedCheats) {
            try {
                setCheats(JSON.parse(savedCheats))
            } catch (e) {
                console.error('Failed to load cheats', e)
            }
        }
    }, [])

    const saveCheats = () => {
        localStorage.setItem('neon-vortex-cheats', JSON.stringify(cheats))
        alert('Cheats Saved!')
    }

    const resetCheats = () => {
        const defaults: CheatConfig = {
            enemySpawnRate: 60,
            powerUpChance: 0.3,
            enemySpeedMultiplier: 1.0,
            godMode: false,
            survivalThresholdOverride: null
        }
        setCheats(defaults)
        localStorage.removeItem('neon-vortex-cheats')
    }

    useEffect(() => {
        localStorage.setItem('neon-vortex-options', JSON.stringify(options))
    }, [options])

    useEffect(() => {
        if (!canvasRef.current) return

        const engine = new GameEngine(
            canvasRef.current,
            (state, score, level, dpm) => {
                setGameState(state)
                setScore(score)
                setLevel(level)
                setDpm(dpm)
            }
        )
        engineRef.current = engine
        engine.setOptions(options)
        engine.setCheats(cheats)

        return () => {
            engine.destroy()
        }
    }, [])

    // Update engine when options change
    useEffect(() => {
        engineRef.current?.setOptions(options)
    }, [options])

    // Update engine when cheats change
    useEffect(() => {
        engineRef.current?.setCheats(cheats)
    }, [cheats])

    const startGame = () => engineRef.current?.startGame()
    const resumeGame = () => engineRef.current?.resume()
    const restartGame = () => engineRef.current?.restart()
    const exitToMenu = () => engineRef.current?.exitToMenu()

    const toggleWallMode = () => {
        setOptions(prev => ({ ...prev, wallMode: prev.wallMode === 'DIE' ? 'BOUNCE' : 'DIE' }))
    }

    const toggleGameMode = () => {
        const modes: GameOptions['gameMode'][] = ['NORMAL', 'INFINITE', 'SURVIVAL']
        const next = modes[(modes.indexOf(options.gameMode) + 1) % modes.length]
        setOptions({ ...options, gameMode: next })
    }

    const toggleSurvivalThreshold = () => {
        const thresholds = [10, 20, 30, 40, 50]
        const currentThreshold = options.survivalThreshold ?? thresholds[0] // Default to first if undefined
        const next = thresholds[(thresholds.indexOf(currentThreshold) + 1) % thresholds.length]
        setOptions({ ...options, survivalThreshold: next })
    }

    const toggleEnemySpeed = () => {
        setOptions(prev => {
            const next = prev.enemySpeed === 'SLOW' ? 'NORMAL' : prev.enemySpeed === 'NORMAL' ? 'FAST' : 'SLOW'
            return { ...prev, enemySpeed: next }
        })
    }

    const toggleMovementMode = () => {
        setOptions(prev => ({ ...prev, movementMode: prev.movementMode === 'RECOIL' ? 'WASD' : 'RECOIL' }))
    }

    const toggleSound = () => {
        setOptions(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
    }

    const toggleAutoFire = () => {
        setOptions(prev => ({ ...prev, autoFire: !prev.autoFire }))
    }

    const toggleDifficulty = () => {
        setOptions(prev => {
            const next = prev.difficulty === 'EASY' ? 'NORMAL' : prev.difficulty === 'NORMAL' ? 'HARD' : 'EASY'
            return { ...prev, difficulty: next }
        })
    }

    const resetToDefaults = () => {
        setOptions(DEFAULT_OPTIONS)
    }

    // ...

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: '100%' }}
            />

            {/* HUD */}
            <div style={{
                position: 'absolute',
                top: 20,
                left: 0,
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0 40px',
                boxSizing: 'border-box',
                pointerEvents: 'none',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '24px',
                textShadow: '0 0 10px #0ff'
            }}>
                <div>SCORE: {score}</div>
                <div>HI: {highScore}</div>
                {options.gameMode === 'INFINITE' && <div>DEATHS/MIN: {dpm}</div>}
                {options.gameMode === 'SURVIVAL' && (
                    <div style={{ color: dpm > (cheats.survivalThresholdOverride ?? options.survivalThreshold) ? '#f00' : '#fff' }}>
                        DPM: {dpm} / {cheats.survivalThresholdOverride ?? options.survivalThreshold}
                        {engineRef.current && engineRef.current.totalEnemiesSpawned < Math.ceil(120 / ((cheats.survivalThresholdOverride ?? options.survivalThreshold) || 1)) && (
                            <span style={{ fontSize: '16px', color: '#aaa', marginLeft: '10px' }}>
                                (Grace: {engineRef.current.totalEnemiesSpawned}/{Math.ceil(120 / ((cheats.survivalThresholdOverride ?? options.survivalThreshold) || 1))})
                            </span>
                        )}
                    </div>
                )}
                <div>LEVEL: {level}</div>
            </div>

            {/* PowerUps HUD */}
            <div style={{
                position: 'absolute',
                top: 60,
                left: 40,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none',
                fontFamily: 'monospace',
                fontSize: '20px',
                fontWeight: 'bold'
            }}>
                {engineRef.current?.['player']?.hasPowerUp('SHIELD') && (
                    <div style={{
                        color: '#00ffff',
                        textShadow: '0 0 10px #00ffff',
                        animation: 'pulse 1s infinite'
                    }}>🛡️ SHIELD ACTIVE</div>
                )}
                {engineRef.current?.['player']?.hasPowerUp('RAPID_FIRE') && (
                    <div style={{
                        color: '#ff9900',
                        textShadow: '0 0 10px #ff9900',
                        animation: 'pulse 0.5s infinite'
                    }}>⚡ RAPID FIRE</div>
                )}
                {engineRef.current?.['player']?.hasPowerUp('SPREAD') && (
                    <div style={{
                        color: '#ff00ff',
                        textShadow: '0 0 10px #ff00ff',
                        animation: 'pulse 0.8s infinite'
                    }}>💥 SPREAD SHOT</div>
                )}
            </div>

            {/* Game Info HUD */}
            <div style={{
                position: 'absolute',
                top: 60,
                right: 40,
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                pointerEvents: 'none',
                fontFamily: 'monospace',
                fontSize: '16px',
                color: '#aaa',
                textAlign: 'right',
                textShadow: '0 0 5px #aaa'
            }}>
                <div>MODE: {options.gameMode}</div>
                <div>DIFF: {options.difficulty}</div>
                <div>SPEED: {options.enemySpeed}</div>
                <div>WALL: {options.wallMode}</div>
            </div>

            {/* Overlays */}
            {gameState === GameState.MENU && !showOptions && !showGuide && !showCheats && (
                <div style={overlayStyle}>
                    <h1 style={titleStyle}>NEON VORTEX</h1>
                    <button onClick={startGame} style={buttonStyle}>START GAME</button>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                        <button onClick={() => setShowGuide(true)} style={{ ...buttonStyle, fontSize: '18px' }}>GUIDE</button>
                        <button onClick={() => setShowOptions(true)} style={{ ...buttonStyle, fontSize: '18px' }}>OPTIONS</button>
                        <button onClick={() => setShowCheats(true)} style={{ ...buttonStyle, fontSize: '18px', borderColor: '#ff00ff', color: '#ff00ff', boxShadow: '0 0 15px rgba(255, 0, 255, 0.3)' }}>CHEATS</button>
                    </div>
                    <p style={hintStyle}>
                        {options.movementMode === 'RECOIL'
                            ? 'Mouse to Aim • Click to Shoot • Recoil to Move'
                            : 'WASD to Move • Mouse/Space to Shoot'}
                    </p>
                </div>
            )}

            {gameState === GameState.MENU && showGuide && (
                <div style={overlayStyle}>
                    <h1 style={{ ...titleStyle, fontSize: '48px', marginBottom: '20px' }}>GAME GUIDE</h1>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', maxWidth: '800px', width: '100%', marginBottom: '30px' }}>
                        {/* Enemies */}
                        <div>
                            <h2 style={{ color: '#fff', borderBottom: '2px solid #fff', paddingBottom: '10px' }}>ENEMIES</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f0f', boxShadow: '0 0 10px #f0f' }}></div>
                                    <div>
                                        <div style={{ color: '#f0f', fontWeight: 'bold' }}>NORMAL</div>
                                        <div style={{ fontSize: '14px', color: '#ccc' }}>Basic chaser. 100 pts.</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#ff0', boxShadow: '0 0 10px #ff0' }}></div>
                                    <div>
                                        <div style={{ color: '#ff0', fontWeight: 'bold' }}>DASHER</div>
                                        <div style={{ fontSize: '14px', color: '#ccc' }}>Fast bursts. 100 pts.</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0f0', boxShadow: '0 0 10px #0f0' }}></div>
                                    <div>
                                        <div style={{ color: '#0f0', fontWeight: 'bold' }}>SHOOTER</div>
                                        <div style={{ fontSize: '14px', color: '#ccc' }}>Fires back! 100 pts.</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f00', boxShadow: '0 0 10px #f00' }}></div>
                                    <div>
                                        <div style={{ color: '#f00', fontWeight: 'bold' }}>TANK</div>
                                        <div style={{ fontSize: '14px', color: '#ccc' }}>High HP. 300 pts.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Powerups */}
                        <div>
                            <h2 style={{ color: '#fff', borderBottom: '2px solid #fff', paddingBottom: '10px' }}>POWER-UPS</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#ff9900', boxShadow: '0 0 10px #ff9900' }}></div>
                                    <div>
                                        <div style={{ color: '#ff9900', fontWeight: 'bold' }}>RAPID FIRE</div>
                                        <div style={{ fontSize: '14px', color: '#ccc' }}>Machine gun mode!</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#ff00ff', boxShadow: '0 0 10px #ff00ff' }}></div>
                                    <div>
                                        <div style={{ color: '#ff00ff', fontWeight: 'bold' }}>SPREAD</div>
                                        <div style={{ fontSize: '14px', color: '#ccc' }}>Triple shot shotgun!</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#00ffff', boxShadow: '0 0 10px #00ffff' }}></div>
                                    <div>
                                        <div style={{ color: '#00ffff', fontWeight: 'bold' }}>SHIELD</div>
                                        <div style={{ fontSize: '14px', color: '#ccc' }}>Protects from 1 hit.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => setShowGuide(false)} style={buttonStyle}>BACK</button>
                </div>
            )}

            {gameState === GameState.MENU && showOptions && (
                <div style={overlayStyle}>
                    <h1 style={{ ...titleStyle, fontSize: '48px', marginBottom: '20px' }}>OPTIONS</h1>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '15px 30px',
                        marginBottom: '30px',
                        width: '100%',
                        maxWidth: '600px'
                    }}>
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
                            <span>DIFFICULTY:</span>
                            <button onClick={toggleDifficulty} style={optionButtonStyle}>{options.difficulty}</button>
                        </div>

                        <div style={optionRowStyle}>
                            <span>SOUND:</span>
                            <button onClick={toggleSound} style={optionButtonStyle}>{options.soundEnabled ? 'ON' : 'OFF'}</button>
                        </div>

                        <div style={optionRowStyle}>
                            <span>AUTO FIRE:</span>
                            <button onClick={toggleAutoFire} style={optionButtonStyle}>{options.autoFire ? 'ON' : 'OFF'}</button>
                        </div>
                    </div>

                    <button onClick={resetToDefaults} style={{ ...buttonStyle, fontSize: '16px', padding: '10px 20px', background: 'rgba(255, 0, 0, 0.2)', marginBottom: '15px' }}>RESET DEFAULTS</button>
                    <button onClick={() => setShowOptions(false)} style={{ ...buttonStyle, marginTop: '20px' }}>BACK</button>
                </div>
            )}

            {gameState === GameState.MENU && showCheats && (
                <div style={overlayStyle}>
                    <h1 style={{ ...titleStyle, fontSize: '48px', marginBottom: '20px', color: '#ff00ff', textShadow: '0 0 20px #ff00ff' }}>CHEAT MODE</h1>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        marginBottom: '30px',
                        width: '100%',
                        maxWidth: '600px'
                    }}>
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
                        <div style={{ fontSize: '14px', color: '#888', marginTop: '-15px', textAlign: 'right' }}>Lower = Faster Spawns</div>

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
                            <span style={{ fontSize: '20px' }}>ENEMY SPEED: {cheats.enemySpeedMultiplier}x</span>
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
            )}

            {gameState === GameState.PAUSED && (
                <div style={overlayStyle}>
                    <h1 style={titleStyle}>PAUSED</h1>
                    <button onClick={resumeGame} style={buttonStyle}>RESUME</button>
                    <button onClick={exitToMenu} style={{ ...buttonStyle, marginTop: '20px', borderColor: '#fff', color: '#fff', boxShadow: 'none' }}>EXIT TO MENU</button>
                </div>
            )}

            {gameState === GameState.GAMEOVER && (
                <div style={overlayStyle}>
                    <h1 style={{ ...titleStyle, color: '#f00', textShadow: '0 0 20px #f00' }}>GAME OVER</h1>
                    <div style={{ fontSize: '32px', marginBottom: '20px' }}>FINAL SCORE: {score}</div>
                    {score >= highScore && score > 0 && (
                        <div style={{ fontSize: '24px', color: '#ff0', marginBottom: '40px', animation: 'pulse 1s infinite' }}>NEW HIGH SCORE!</div>
                    )}
                    <button onClick={restartGame} style={buttonStyle}>TRY AGAIN</button>
                    <button onClick={exitToMenu} style={{ ...buttonStyle, marginTop: '20px', borderColor: '#fff', color: '#fff', boxShadow: 'none' }}>EXIT TO MENU</button>
                </div>
            )}
        </div>
    )
}

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
    fontFamily: 'monospace'
}

const titleStyle: React.CSSProperties = {
    fontSize: '80px',
    marginBottom: '40px',
    textShadow: '0 0 20px #0ff, 0 0 40px #0ff',
    letterSpacing: '10px'
}

const buttonStyle: React.CSSProperties = {
    padding: '15px 40px',
    fontSize: '24px',
    backgroundColor: 'transparent',
    color: '#0ff',
    border: '2px solid #0ff',
    borderRadius: '5px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
    transition: 'all 0.2s'
}

const optionRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: '20px',
    fontSize: '24px'
}

const optionButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    padding: '10px 20px',
    fontSize: '20px',
    width: '150px'
}

const hintStyle: React.CSSProperties = {
    marginTop: '40px',
    color: '#888',
    fontSize: '16px'
}
