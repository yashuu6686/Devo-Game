import React, { useRef, useState, useEffect, useCallback } from "react";

/**
 Premium Mobile Game Style - Dragon Jump (Single-file React component)
 - requestAnimationFrame game loop (smooth)
 - parallax clouds, animated ground, soft physics jump
 - tap / click anywhere inside game area to jump
 - start screen, pause on blur, game over screen + mobile replay button
 - score & high score saved in localStorage
 - prevents scroll while touching game area on mobile
 - inline styles so you can drop it straight in
*/

export default function DragonJumpPremium() {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Game state
  const [width, setWidth] = useState(360); // game width (px)
  const [height, setHeight] = useState(202); // game height (px) -> 16:9-ish
  const [running, setRunning] = useState(false); // true after start
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    () => Number(localStorage.getItem("dj_highscore") || 0)
  );

  // Player physics
  const playerRef = useRef({
    x: 0, // left relative to game area
    y: 0, // bottom distance from ground
    vy: 0, // velocity Y
    w: 0,
    h: 0,
    jumping: false,
  });

  // Obstacles & background
  const obstaclesRef = useRef([]);
  const cloudOffsetRef = useRef(0);
  const groundOffsetRef = useRef(0);
  const baseSpeedRef = useRef(220); // px per second baseline
  const spawnTimerRef = useRef(0);
  const difficultyRef = useRef(0);

  // audio refs (optional)
  const jumpAudioRef = useRef(null);
  const hitAudioRef = useRef(null);
  const musicRef = useRef(null);

  // responsive init and resize
  useEffect(() => {
    const updateSize = () => {
      const vw = Math.min(window.innerWidth, 480);
      // keep some margin
      const w = Math.max(300, Math.round(vw * 0.95));
      // use a 16:9-ish height but taller for mobile game feel
      const h = Math.round((w / 9) * 5.4); // ~16:9 but slightly taller
      setWidth(w);
      setHeight(h);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // utility - reset game world
  const resetWorld = useCallback(() => {
    // set player position & sizes relative to width/height
    const pW = Math.round(width * 0.18);
    const pH = Math.round(height * 0.30);
    playerRef.current = {
      x: Math.round(width * 0.10),
      y: Math.round(height * 0.12), // bottom distance
      vy: 0,
      w: pW,
      h: pH,
      jumping: false,
    };

    obstaclesRef.current = [];
    cloudOffsetRef.current = 0;
    groundOffsetRef.current = 0;
    baseSpeedRef.current = Math.round(180 + Math.min(width, 420) * 0.2);
    spawnTimerRef.current = 0;
    difficultyRef.current = 0;
    setScore(0);
    setIsGameOver(false);
  }, [width, height]);

  // Start game
  const startGame = useCallback(() => {
    resetWorld();
    setRunning(true);
    setIsGameOver(false);
    lastTimeRef.current = performance.now();
    // play optional background music
    if (musicRef.current) {
      musicRef.current.currentTime = 0;
      musicRef.current.play().catch(() => {});
    }
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [resetWorld]);

  // Stop / pause (when game over or tab blur)
  const stopGame = useCallback(() => {
    setRunning(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (musicRef.current) {
      musicRef.current.pause();
    }
  }, []);

  // Jump action (touch or click)
  const doJump = useCallback(() => {
    if (!running || isGameOver) return;
    const p = playerRef.current;
    // allow a short double-jump prevention window, but give smooth jump
    if (p.jumping && p.vy > 0) return;
    p.vy = -Math.max( -12, -14 ); // upward velocity (negative because y increases downward in our coord)
    p.jumping = true;
    // play jump sound
    if (jumpAudioRef.current) {
      jumpAudioRef.current.currentTime = 0;
      jumpAudioRef.current.play().catch(() => {});
    }
  }, [running, isGameOver]);

  // Touch handlers to prevent page scroll while touching game
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventMove = (e) => {
      // only prevent when playing
      if (running) e.preventDefault();
    };
    el.addEventListener("touchmove", preventMove, { passive: false });
    return () => el.removeEventListener("touchmove", preventMove);
  }, [running]);

  // Game Loop: physics + spawn obstacles + movement + collision
  function gameLoop(now) {
    const dt = Math.min(40, now - lastTimeRef.current); // ms, clamp
    lastTimeRef.current = now;
    const dtSec = dt / 1000;

    // Update background offsets (parallax)
    cloudOffsetRef.current += dtSec * 12; // slow clouds
    groundOffsetRef.current += dtSec * (baseSpeedRef.current * 0.6) * 0.5;

    // Move obstacles
    const speed = baseSpeedRef.current + difficultyRef.current * 22; // px/sec
    const moveX = speed * dtSec;

    obstaclesRef.current.forEach((o) => {
      o.x -= moveX;
    });

    // Remove offscreen obstacles
    obstaclesRef.current = obstaclesRef.current.filter((o) => o.x + o.w > -50);

    // Spawn new obstacle occasionally (difficulty increases with score)
    spawnTimerRef.current += dt;
    const spawnInterval = Math.max(650 - Math.min(350, difficultyRef.current * 15), 320);
    if (spawnTimerRef.current > spawnInterval) {
      spawnTimerRef.current = 0;
      // create obstacle with some variety
      const ow = Math.round(width * (0.10 + Math.random() * 0.12));
      const oh = Math.round(height * (0.18 + Math.random() * 0.14));
      const o = {
        x: width + 20,
        y: Math.round(height * 0.12), // bottom
        w: ow,
        h: oh,
        emoji: Math.random() > 0.5 ? "🐉" : "🌵",
      };
      obstaclesRef.current.push(o);
    }

    // Update player physics (we use bottom-based coordinates)
    const gravity = 34; // px / s^2 (tune for feel)
    const p = playerRef.current;
    p.vy += gravity * dtSec; // gravity increases vy downward
    p.y += p.vy; // move

    // ground clamp
    const groundY = Math.round(height * 0.12);
    if (p.y >= groundY) {
      p.y = groundY;
      p.vy = 0;
      p.jumping = false;
    }

    // Collision detection (AABB)
    const pLeft = p.x;
    const pRight = p.x + p.w;
    const pBottom = p.y;
    const pTop = p.y + p.h;

    let collided = false;
    obstaclesRef.current.forEach((o) => {
      const oLeft = o.x;
      const oRight = o.x + o.w;
      const oBottom = o.y;
      const oTop = o.y + o.h;
      if (
        pRight >= oLeft + Math.round(o.w * 0.08) &&
        pLeft <= oRight - Math.round(o.w * 0.08) &&
        pBottom <= oTop - Math.round(o.h * 0.08) &&
        pTop >= oBottom + Math.round(o.h * 0.08)
      ) {
        collided = true;
      }
    });

    if (collided) {
      // Game Over
      setIsGameOver(true);
      stopGame();
      // play hit sound
      if (hitAudioRef.current) {
        hitAudioRef.current.currentTime = 0;
        hitAudioRef.current.play().catch(() => {});
      }
      // save highscore
      setHighScore((h) => {
        const newH = Math.max(h, score);
        localStorage.setItem("dj_highscore", String(newH));
        return newH;
      });
      return;
    }

    // Score: increment when obstacles pass the player
    obstaclesRef.current.forEach((o) => {
      if (!o.passed && o.x + o.w < playerRef.current.x) {
        o.passed = true;
        setScore((s) => {
          const ns = s + 1;
          // increase difficulty every few points
          difficultyRef.current = Math.floor(ns / 5);
          return ns;
        });
      }
    });

    // continue loop
    if (!isGameOver) {
      rafRef.current = requestAnimationFrame(gameLoop);
    }

    // request a component update by toggling a small state change — but we avoid frequent setState
    // We'll force React to re-render at ~60fps by updating a dummy ref -> but to keep things simple,
    // rely on useEffect that uses requestAnimationFrame for painting via inline styles in render.
    // We'll use a manual triggering by calling setTick using a ref hook below (optimized).
    setTick((t) => t + 1);
  }

  // small state to trigger re-render
  const [, setTick] = useState(0);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // keyboard support (space to jump)
  useEffect(() => {
    const handler = (e) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (running && !isGameOver) doJump();
      }
      if (e.key === "Enter" && isGameOver) {
        // restart
        resetWorld();
        startGame();
      }
    };
    window.addEventListener("keydown", handler, { passive: false });
    return () => window.removeEventListener("keydown", handler);
  }, [running, isGameOver, doJump, startGame, resetWorld]);

  // start/pause on visibility change
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        // pause music and game
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        if (musicRef.current) musicRef.current.pause();
      } else {
        if (running && !isGameOver) {
          lastTimeRef.current = performance.now();
          rafRef.current = requestAnimationFrame(gameLoop);
          if (musicRef.current) musicRef.current.play().catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [running, isGameOver]);

  // click / touch handlers inside game area
  const onTap = (e) => {
    // if on start screen, start
    if (!running && !isGameOver) {
      startGame();
      return;
    }
    if (isGameOver) {
      // if game over and user taps overlay, restart
      resetWorld();
      startGame();
      return;
    }
    doJump();
  };

  // initialize world once sizes are set
  useEffect(() => {
    resetWorld();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  // small helper for inline styles
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Render helpers: draw clouds, obstacles, ground, player
  // We compute positions from refs
  const player = playerRef.current;
  const obstacles = obstaclesRef.current.slice();
  const cloudOffset = cloudOffsetRef.current;
  const groundOffset = groundOffsetRef.current;

  // UI styles
  const containerStyle = {
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(180deg,#87CEEB,#C9F0FF 60%, #A7EFA7)",
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    overflow: "hidden",
    WebkitUserSelect: "none",
    userSelect: "none",
    padding: 12,
    boxSizing: "border-box",
  };

  const gameWrapperStyle = {
    width,
    height,
    maxWidth: "95vw",
    borderRadius: 16,
    overflow: "hidden",
    border: "6px solid rgba(255,215,0,0.95)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    position: "relative",
    background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    touchAction: "none",
  };

  const skyStyle = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg,#9CE6FF 0%, #87CEEB 40%, #7BD07B 100%)",
  };

  const cloudsStyle = {
    position: "absolute",
    left: -(cloudOffset % (width + 200)),
    top: Math.round(height * 0.06),
    height: Math.round(height * 0.25),
    width: "200%",
    pointerEvents: "none",
    opacity: 0.9,
  };

  const groundStyle = {
    position: "absolute",
    bottom: 0,
    left: -(groundOffset % (width)),
    height: Math.round(height * 0.14),
    width: width * 2,
    background:
      "repeating-linear-gradient(90deg,#26a84a 0 60px,#1e8a3a 60px 120px)",
    transform: "skewY(-1deg)",
  };

  const scorePanelStyle = {
    position: "absolute",
    top: 12,
    left: 12,
    background: "rgba(255,255,255,0.95)",
    padding: "8px 12px",
    borderRadius: 12,
    border: "3px solid gold",
    zIndex: 50,
    fontWeight: 700,
  };

  const startOverlayStyle = {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.45))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 12,
    color: "white",
    zIndex: 60,
  };

  const gameOverOverlayStyle = {
    ...startOverlayStyle,
    background: "linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.7))",
  };

  return (
    <div style={containerStyle}>
      {/* optional audio elements */}
      <audio ref={jumpAudioRef} src="/devo.mp3" preload="auto" />
      <audio ref={hitAudioRef} src="/devo2.mp3" preload="auto" />
      <audio ref={musicRef} src="/devo.mp3" preload="auto" loop />

      <div
        ref={containerRef}
        style={gameWrapperStyle}
        onClick={onTap}
        onTouchStart={(e) => {
          // ensure tap works and prevents scroll
          e.preventDefault();
          onTap(e);
        }}
        role="button"
        tabIndex={0}
      >
        {/* Sky / Background */}
        <div style={skyStyle} />

        {/* Parallax clouds */}
        <div style={cloudsStyle}>
          {/* use multiple cloud layers with different opacities and positions */}
          <div
            style={{
              position: "absolute",
              left: cloudOffset * 0.3,
              top: Math.sin(cloudOffset * 0.02) * 6,
              fontSize: Math.round(width * 0.12),
              opacity: 0.9,
              transform: "translateX(0)",
            }}
          >
            ☁️ ☁️
          </div>
          <div
            style={{
              position: "absolute",
              left: cloudOffset * 0.8 + 120,
              top: Math.cos(cloudOffset * 0.018) * 8 + 18,
              fontSize: Math.round(width * 0.09),
              opacity: 0.8,
            }}
          >
            ☁️
          </div>
        </div>

        {/* Obstacles */}
        {obstacles.map((o, idx) => {
          const left = Math.round(o.x);
          const bottom = o.y;
          const style = {
            position: "absolute",
            left,
            bottom,
            width: o.w,
            height: o.h,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            fontSize: Math.max(32, Math.round(o.h * 0.9)),
            transform: "translateZ(0)",
            pointerEvents: "none",
            filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.25))",
          };
          return (
            <div key={idx} style={style}>
              <div style={{ transform: "translateY(6px)" }}>{o.emoji}</div>
            </div>
          );
        })}

        {/* Player */}
        <div
          style={{
            position: "absolute",
            left: player.x,
            bottom: player.y,
            width: player.w,
            height: player.h,
            transition: "transform 80ms linear",
            transform: `translateY(0)`,
            zIndex: 40,
            pointerEvents: "none",
          }}
        >
          <img
            src="/devoImg.png"
            alt="player"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: player.jumping ? "rotate(-7deg)" : "rotate(0deg)",
              transition: "transform 120ms ease",
              filter: "drop-shadow(0 8px 8px rgba(0,0,0,0.25))",
            }}
          />
        </div>

        {/* Scrolling ground */}
        <div style={groundStyle} />

        {/* Score panel */}
        <div style={scorePanelStyle}>
          <div style={{ fontSize: 16, color: "#ff3b3b" }}>Score: {score}</div>
          <div style={{ fontSize: 12, color: "#1e5cff" }}>High: {highScore}</div>
        </div>

        {/* Start overlay */}
        {!running && !isGameOver && (
          <div style={startOverlayStyle}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Dragon Run</h1>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.95 }}>
              Tap anywhere to start and jump
            </p>
            <div
              style={{
                marginTop: 8,
                background: "linear-gradient(#32CD32,#228B22)",
                padding: "10px 18px",
                borderRadius: 24,
                fontSize: 16,
                fontWeight: 700,
                boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
              }}
            >
              Start
            </div>
            <small style={{ opacity: 0.85, marginTop: 6 }}>
              Mobile optimized — tap to jump
            </small>
          </div>
        )}

        {/* Game over overlay */}
        {isGameOver && (
          <div style={gameOverOverlayStyle}>
            <h1 style={{ color: "gold", fontSize: 36, margin: 0 }}>Game Over</h1>
            <div style={{ color: "white", fontSize: 18, marginTop: 6 }}>
              Score: {score} • High: {highScore}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetWorld();
                  startGame();
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: 22,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Replay
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // go to start screen
                  resetWorld();
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: 22,
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.12)",
                  cursor: "pointer",
                }}
              >
                Menu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky mobile replay button (visible when game over) */}
      {isGameOver && (
        <button
          onClick={() => {
            resetWorld();
            startGame();
          }}
          style={{
            position: "fixed",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#ff3b3b",
            color: "white",
            border: "none",
            padding: "12px 22px",
            borderRadius: 30,
            fontSize: 18,
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
            zIndex: 200,
          }}
        >
          🔁 Replay
        </button>
      )}
    </div>
  );
}
