import React from 'react'
import { GameOptions, CheatConfig } from '../game/types'
import { PowerUpType } from '../game/Entities'

interface HUDProps {
    score: number
    highScore: number
    dpm: number
    level: number
    options: GameOptions
    cheats: CheatConfig
    activePowerUps: PowerUpType[]
    totalEnemiesSpawned: number
}

export const HUD: React.FC<HUDProps> = ({ score, highScore, dpm, level, options, cheats, activePowerUps, totalEnemiesSpawned }) => {
    return (
        <>
            {/* Top Bar HUD */}
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
                        {totalEnemiesSpawned < Math.ceil(120 / ((cheats.survivalThresholdOverride ?? options.survivalThreshold) || 1)) && (
                            <span style={{ fontSize: '16px', color: '#aaa', marginLeft: '10px' }}>
                                (Grace: {totalEnemiesSpawned}/{Math.ceil(120 / ((cheats.survivalThresholdOverride ?? options.survivalThreshold) || 1))})
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
                {activePowerUps.includes('SHIELD') && (
                    <div style={{
                        color: '#00ffff',
                        textShadow: '0 0 10px #00ffff',
                        animation: 'pulse 1s infinite'
                    }}>🛡️ SHIELD ACTIVE</div>
                )}
                {activePowerUps.includes('RAPID_FIRE') && (
                    <div style={{
                        color: '#ff9900',
                        textShadow: '0 0 10px #ff9900',
                        animation: 'pulse 0.5s infinite'
                    }}>⚡ RAPID FIRE</div>
                )}
                {activePowerUps.includes('SPREAD') && (
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
        </>
    )
}
