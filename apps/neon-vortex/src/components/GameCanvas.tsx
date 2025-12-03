import { useEffect, useRef, useState } from 'react'
import { GameEngine } from '../game/Engine'
import { GameState, GameOptions, CheatConfig } from '../game/types'
import { PowerUpType } from '../game/Entities'
import { HUD } from './HUD'
import { MainMenu, PauseMenu, GameOverMenu, GuideOverlay, OptionsOverlay, CheatOverlay } from './Menus'

export function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<GameEngine | null>(null)

    const [gameState, setGameState] = useState<GameState>(GameState.MENU)
    const [score, setScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [dpm, setDpm] = useState(0)
    const [activePowerUps, setActivePowerUps] = useState<PowerUpType[]>([])
    const [totalEnemiesSpawned, setTotalEnemiesSpawned] = useState(0)
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
            (state, score, level, dpm, powerups, enemiesSpawned) => {
                setGameState(state)
                setScore(score)
                setLevel(level)
                setDpm(dpm)
                setActivePowerUps(powerups)
                setTotalEnemiesSpawned(enemiesSpawned)
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

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: '100%' }}
            />

            <HUD
                score={score}
                highScore={highScore}
                dpm={dpm}
                level={level}
                options={options}
                cheats={cheats}
                activePowerUps={activePowerUps}
                totalEnemiesSpawned={totalEnemiesSpawned}
            />

            {/* Overlays */}
            {gameState === GameState.MENU && !showOptions && !showGuide && !showCheats && (
                <MainMenu
                    startGame={startGame}
                    setShowGuide={setShowGuide}
                    setShowOptions={setShowOptions}
                    setShowCheats={setShowCheats}
                    options={options}
                />
            )}

            {showGuide && <GuideOverlay setShowGuide={setShowGuide} />}

            {showOptions && (
                <OptionsOverlay
                    options={options}
                    setOptions={setOptions}
                    setShowOptions={setShowOptions}
                    DEFAULT_OPTIONS={DEFAULT_OPTIONS}
                />
            )}

            {showCheats && (
                <CheatOverlay
                    cheats={cheats}
                    setCheats={setCheats}
                    setShowCheats={setShowCheats}
                    saveCheats={saveCheats}
                    resetCheats={resetCheats}
                />
            )}

            {gameState === GameState.PAUSED && (
                <PauseMenu resumeGame={resumeGame} exitToMenu={exitToMenu} />
            )}

            {gameState === GameState.GAMEOVER && (
                <GameOverMenu
                    score={score}
                    highScore={highScore}
                    restartGame={restartGame}
                    exitToMenu={exitToMenu}
                />
            )}
        </div>
    )
}
