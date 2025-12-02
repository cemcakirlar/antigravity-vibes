import { useEffect, useRef, useState } from 'react'
import { GameEngine, GameState, GameOptions } from '../game/Engine'

export function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<GameEngine | null>(null)

    const [gameState, setGameState] = useState<GameState>(GameState.MENU)
    const [score, setScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [dpm, setDpm] = useState(0)

    const [options, setOptions] = useState<GameOptions>(() => {
        const saved = localStorage.getItem('neon-vortex-options')
        return saved ? JSON.parse(saved) : {
            wallMode: 'DIE',
            gameMode: 'NORMAL',
            enemySpeed: 'NORMAL'
        }
    })
    const [showOptions, setShowOptions] = useState(false)

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

        return () => {
            engine.destroy()
        }
    }, [])

    // Update engine when options change
    useEffect(() => {
        engineRef.current?.setOptions(options)
    }, [options])

    const startGame = () => engineRef.current?.startGame()
    const resumeGame = () => engineRef.current?.resume()
    const restartGame = () => engineRef.current?.restart()
    const exitToMenu = () => engineRef.current?.exitToMenu()

    const toggleWallMode = () => {
        setOptions(prev => ({ ...prev, wallMode: prev.wallMode === 'DIE' ? 'BOUNCE' : 'DIE' }))
    }

    const toggleGameMode = () => {
        setOptions(prev => ({ ...prev, gameMode: prev.gameMode === 'NORMAL' ? 'INFINITE' : 'NORMAL' }))
    }

    const toggleEnemySpeed = () => {
        setOptions(prev => {
            const next = prev.enemySpeed === 'SLOW' ? 'NORMAL' : prev.enemySpeed === 'NORMAL' ? 'FAST' : 'SLOW'
            return { ...prev, enemySpeed: next }
        })
    }

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
                {options.gameMode === 'INFINITE' && <div>DEATHS/MIN: {dpm}</div>}
                <div>LEVEL: {level}</div>
            </div>

            {/* Overlays */}
            {gameState === GameState.MENU && !showOptions && (
                <div style={overlayStyle}>
                    <h1 style={titleStyle}>NEON VORTEX</h1>
                    <button onClick={startGame} style={buttonStyle}>START GAME</button>
                    <button onClick={() => setShowOptions(true)} style={{ ...buttonStyle, marginTop: '20px', fontSize: '18px' }}>OPTIONS</button>
                    <p style={hintStyle}>Mouse to Aim • Click to Shoot • Recoil to Move</p>
                </div>
            )}

            {gameState === GameState.MENU && showOptions && (
                <div style={overlayStyle}>
                    <h1 style={titleStyle}>OPTIONS</h1>

                    <div style={optionRowStyle}>
                        <span>WALL BEHAVIOR:</span>
                        <button onClick={toggleWallMode} style={optionButtonStyle}>
                            {options.wallMode}
                        </button>
                    </div>

                    <div style={optionRowStyle}>
                        <span>GAME MODE:</span>
                        <button onClick={toggleGameMode} style={optionButtonStyle}>
                            {options.gameMode}
                        </button>
                    </div>

                    <div style={optionRowStyle}>
                        <span>ENEMY SPEED:</span>
                        <button onClick={toggleEnemySpeed} style={optionButtonStyle}>
                            {options.enemySpeed}
                        </button>
                    </div>

                    <button onClick={() => setShowOptions(false)} style={{ ...buttonStyle, marginTop: '40px' }}>BACK</button>
                </div>
            )}

            {gameState === GameState.PAUSED && (
                <div style={overlayStyle}>
                    <h1 style={titleStyle}>PAUSED</h1>
                    <button onClick={resumeGame} style={buttonStyle}>RESUME</button>
                    <button onClick={exitToMenu} style={{ ...buttonStyle, marginTop: '20px', borderColor: '#f00', color: '#f00', boxShadow: '0 0 15px rgba(255, 0, 0, 0.3)' }}>EXIT TO MENU</button>
                </div>
            )}

            {gameState === GameState.GAMEOVER && (
                <div style={overlayStyle}>
                    <h1 style={{ ...titleStyle, color: '#f00', textShadow: '0 0 20px #f00' }}>GAME OVER</h1>
                    <div style={{ fontSize: '32px', marginBottom: '40px' }}>FINAL SCORE: {score}</div>
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
    width: '400px',
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
