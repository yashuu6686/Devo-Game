import React, { useState, useEffect, useRef } from "react";

export default function DragonJumpGame() {
  const [isJumping, setIsJumping] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [obstaclePosition, setObstaclePosition] = useState(800);
  const [highScore, setHighScore] = useState(0);

  const jumpAudioRef = useRef(null);
  const gameOverAudioRef = useRef(null);

  // ------------------ JUMP FUNCTION ------------------
  const jump = () => {
    if (!isJumping && !isGameOver) {
      setIsJumping(true);

      // Play jump audio
      if (jumpAudioRef.current) {
        jumpAudioRef.current.currentTime = 0;
        jumpAudioRef.current.play().catch(() => {});
      }

      setTimeout(() => setIsJumping(false), 500);
    }
  };

  // --------------- KEYBOARD CONTROLS -----------------
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
      if (e.code === "Enter" && isGameOver) {
        restartGame();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isJumping, isGameOver]);

  // ---------------- GAME LOOP ------------------------
  useEffect(() => {
    if (isGameOver) return;

    const gameLoop = setInterval(() => {
      setObstaclePosition((prev) => {
        if (prev < -60) {
          setScore((s) => s + 1);
          return 800;
        }
        return prev - 10;
      });

      // Character box
      const charTop = isJumping ? 150 : 300;
      const charBottom = charTop + 100;
      const charLeft = 50;
      const charRight = 130;

      // Dragon box
      const dragLeft = obstaclePosition + 15;
      const dragRight = obstaclePosition + 45;
      const dragTop = 315;
      const dragBottom = 370;

      const touching =
        charRight >= dragLeft &&
        charLeft <= dragRight &&
        charBottom >= dragTop &&
        charTop <= dragBottom;

      if (touching) {
        setIsGameOver(true);

        // Play game-over audio
        if (gameOverAudioRef.current) {
          gameOverAudioRef.current.currentTime = 0;
          gameOverAudioRef.current.play().catch(() => {});
        }

        if (score > highScore) setHighScore(score);
      }
    }, 20);

    return () => clearInterval(gameLoop);
  }, [obstaclePosition, isJumping, isGameOver, score, highScore]);

  // ---------------- RESTART GAME ---------------------
  const restartGame = () => {
    setIsGameOver(false);
    setScore(0);
    setObstaclePosition(800);
    setIsJumping(false);
  };

  // ---------------- UI BELOW -------------------------
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background:
          "linear-gradient(180deg, #87CEEB 0%, #E0F6FF 50%, #90EE90 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Comic Sans MS', cursive",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* AUDIO FILES */}
      <audio ref={jumpAudioRef} src="/devo.mp3" preload="auto" />
      <audio ref={gameOverAudioRef} src="/devo2.mp3" preload="auto" />

      {/* SCORE */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          padding: "15px 25px",
          background: "white",
          borderRadius: "20px",
          border: "3px solid gold",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: "bold", color: "#FF6347" }}>
          Score: {score}
        </div>
        <div style={{ fontSize: 16, color: "#4169E1" }}>
          High: {highScore}
        </div>
      </div>

      {/* GAME CONTAINER */}
      <div
        style={{
          position: "relative",
          width: 800,
          height: 400,
          borderRadius: 30,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(144,238,144,0.5))",
          border: "5px solid gold",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={jump}
      >
        {/* GROUND */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: 80,
            background: "linear-gradient(180deg, #90EE90, #228B22)",
          }}
        />

        {/* CHARACTER */}
       <div
  style={{
    position: "absolute",
    left: 50,
    bottom: isJumping ? 230 : 80,
    transition: "bottom 0.5s",
  }}
>
  <img
    src="/devoImg.png"
    alt="Player"
    style={{
      width: 80,
      height: 80,
      objectFit: "contain",
    }}
  />
</div>


        {/* OBSTACLE DRAGON */}
        <div
          style={{
            position: "absolute",
            left: obstaclePosition,
            bottom: 80,
            fontSize: 60,
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
              background: "rgba(0,0,0,0.75)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h1
              style={{
                fontSize: 60,
                color: "gold",
                marginBottom: 20,
                textShadow: "0px 0px 10px black",
              }}
            >
              Game Over
            </h1>
            <h2 style={{ color: "white", marginBottom: 10 }}>
              Score: {score}
            </h2>
            <h3 style={{ color: "#90EE90", marginBottom: 20 }}>
              High Score: {highScore}
            </h3>

            <button
              onClick={restartGame}
              style={{
                padding: "15px 40px",
                fontSize: 25,
                borderRadius: 40,
                border: "none",
                cursor: "pointer",
                background:
                  "linear-gradient(135deg, #32CD32 0%, #228B22 100%)",
                color: "white",
                boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
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
          marginTop: 20,
          padding: "15px 30px",
          background: "white",
          borderRadius: 20,
          border: "3px solid gold",
        }}
      >
        Press **SPACE / ARROW UP / CLICK** to jump.
      </div>
    </div>
  );
}
