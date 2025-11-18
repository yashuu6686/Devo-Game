import React, { useState, useEffect, useRef } from "react";

export default function DragonJumpGame() {
  const containerRef = useRef(null);

  const [isJumping, setIsJumping] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [obstacleX, setObstacleX] = useState(100); // percentage
  const [width, setWidth] = useState(300);

  const jumpAudioRef = useRef(null);
  const gameOverAudioRef = useRef(null);

  // update container width
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // jump
  const jump = () => {
    if (!isJumping && !isGameOver) {
      setIsJumping(true);
      if (jumpAudioRef.current) {
        jumpAudioRef.current.currentTime = 0;
        jumpAudioRef.current.play().catch(() => {});
      }
      setTimeout(() => setIsJumping(false), 450);
    }
  };

  // keyboard support
  useEffect(() => {
    const press = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") jump();
      if (e.code === "Enter" && isGameOver) restartGame();
    };
    window.addEventListener("keydown", press);
    return () => window.removeEventListener("keydown", press);
  }, [isJumping, isGameOver]);

  // game loop
  useEffect(() => {
    if (isGameOver) return;

    const frame = setInterval(() => {
      setObstacleX((prev) => {
        const next = prev - 1.5;
        if (next < -15) {
          setScore((s) => s + 1);
          return 100;
        }
        return next;
      });

      // dynamic responsive values
      const height = (width / 16) * 9;

      // character sizes
      const cW = width * 0.18;
      const cH = height * 0.27;
      const cLeft = width * 0.10;
      const cBottom = isJumping ? height * 0.50 : height * 0.12;

      const cRight = cLeft + cW;
      const cTop = cBottom + cH;

      // obstacle sizes
      const oW = width * 0.14;
      const oH = height * 0.20;
      const oLeft = (obstacleX / 100) * width;
      const oRight = oLeft + oW;
      const oBottom = height * 0.12;
      const oTop = oBottom + oH;

      const touching =
        cRight >= oLeft &&
        cLeft <= oRight &&
        cBottom <= oTop &&
        cTop >= oBottom;

      if (touching) {
        setIsGameOver(true);
        if (gameOverAudioRef.current) {
          gameOverAudioRef.current.currentTime = 0;
          gameOverAudioRef.current.play().catch(() => {});
        }
        setHighScore((h) => (score > h ? score : h));
      }
    }, 25);

    return () => clearInterval(frame);
  }, [isJumping, obstacleX, width]);

  const restartGame = () => {
    setIsGameOver(false);
    setObstacleX(100);
    setScore(0);
  };

  const height = (width / 16) * 9;

  // responsive character sizes for JSX
  const charW = width * 0.18;
  const charH = height * 0.27;
  const charLeft = width * 0.10;
  const charBottom = isJumping ? height * 0.50 : height * 0.12;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg,#87CEEB, #E0F6FF, #90EE90)",
        fontFamily: "'Comic Sans MS', cursive",
        overflow: "hidden",
      }}
    >
      <audio ref={jumpAudioRef} src="/devo.mp3" preload="auto" />
      <audio ref={gameOverAudioRef} src="/devo2.mp3" preload="auto" />

      {/* SCORE PANEL */}
      <div
        style={{
          position: "absolute",
          top: 15,
          left: 15,
          background: "white",
          border: "3px solid gold",
          borderRadius: 16,
          padding: "8px 14px",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: "bold", color: "#ff4a4a" }}>
          Score: {score}
        </div>
        <div style={{ fontSize: 14, color: "#4169E1" }}>High: {highScore}</div>
      </div>

      {/* GAME AREA */}
      <div
        ref={containerRef}
        onClick={jump}
        style={{
          width: "95%",
          maxWidth: 480,
          height,
          background: "rgba(255,255,255,0.4)",
          borderRadius: 20,
          border: "5px solid gold",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Ground */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            height: "12%",
            width: "100%",
            background: "linear-gradient(#228B22,#32CD32)",
          }}
        />

        {/* PLAYER */}
        <div
          style={{
            position: "absolute",
            width: charW,
            height: charH,
            left: charLeft,
            bottom: charBottom,
            transition: "bottom 0.45s",
          }}
        >
          <img
            src="/devoImg.png"
            alt="char"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        {/* OBSTACLE */}
        <div
          style={{
            position: "absolute",
            left: `${obstacleX}%`,
            bottom: height * 0.12,
            fontSize: Math.max(40, width * 0.14),
            transform: "scaleX(-1)",
          }}
        >
          🐉
        </div>

        {/* GAME OVER SCREEN */}
        {isGameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <h1 style={{ color: "gold", fontSize: 40 }}>Game Over</h1>
            <h2 style={{ color: "white" }}>Score: {score}</h2>
            <h3 style={{ color: "#90EE90" }}>High Score: {highScore}</h3>

            <button
              onClick={restartGame}
              style={{
                padding: "12px 30px",
                fontSize: 20,
                background: "linear-gradient(#32CD32,#228B22)",
                borderRadius: 30,
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* INSTRUCTIONS */}
      <div
        style={{
          marginTop: 15,
          padding: "10px 20px",
          background: "white",
          borderRadius: 12,
          border: "3px solid gold",
          fontSize: 14,
        }}
      >
        Tap / Space / Arrow Up to Jump
      </div>
    </div>
  );
}
