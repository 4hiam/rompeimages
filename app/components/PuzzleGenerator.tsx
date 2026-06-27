import React, { useState, useEffect, useRef } from "react";

// Types
interface Operation {
  expression: string;
  result: number;
  verticalParts?: {
    top: string;
    bottom: string;
    operator: string;
  };
}

interface Piece {
  id: number;
  originalIndex: number;
  result: number;
  imagePieceUrl: string; // sliced piece dataUrl
}

export function PuzzleGenerator() {
  const [isMounted, setIsMounted] = useState(false);
  
  // Custom states
  const [image, setImage] = useState<string>("");
  const [gridOption, setGridOption] = useState<6 | 9 | 12>(9);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [format, setFormat] = useState<"horizontal" | "vertical">("vertical");
  const [orientation, setOrientation] = useState<"side-by-side" | "stacked">("side-by-side");
  const [badgePosition, setBadgePosition] = useState<"top-right" | "top-left" | "center">("top-right");
  const [badgeBgOpacity, setBadgeBgOpacity] = useState<number>(0.85);
  const [badgeTextColor, setBadgeTextColor] = useState<string>("#000000");
  const [badgeBgColor, setBadgeBgColor] = useState<string>("#ffffff");
  const [customTitle, setCustomTitle] = useState<string>("Rompecabezas de sumas y restas");
  const [customSubtitle, setCustomSubtitle] = useState<string>("Resuelve las operaciones y pega cada pieza en su resultado correspondiente.");
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"print" | "game">("print");
  
  // Puzzle calculations and permutation
  const [operations, setOperations] = useState<Operation[]>([]);
  const [permutation, setPermutation] = useState<number[]>([]);
  
  // Sliced pieces image data URL array
  const [slicedPieces, setSlicedPieces] = useState<string[]>([]);
  
  // Interactive Game State
  const [gameBoard, setGameBoard] = useState<(number | null)[]>([]); // indexes correspond to board cell, value is the original piece index placed
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null); // index in availablePieces array
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [gameCompleted, setGameCompleted] = useState<boolean>(false);
  const [confettiActive, setConfettiActive] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Set mounted
  useEffect(() => {
    setIsMounted(true);
    // Generate default procedural image
    const defaultImg = generateDefaultImage();
    setImage(defaultImg);
  }, []);

  // Recalculate puzzle when grid size, difficulty or image changes
  useEffect(() => {
    if (!image) return;
    generatePuzzle();
  }, [image, gridOption, difficulty]);

  // Slices the image into grid pieces
  useEffect(() => {
    if (!image) return;
    sliceImage();
  }, [image, gridOption, permutation]);

  // Check victory condition in game mode
  useEffect(() => {
    if (gameBoard.length === 0) return;
    const isWin = gameBoard.every((val, idx) => val === idx);
    if (isWin && gameBoard.length > 0) {
      setGameCompleted(true);
      setConfettiActive(true);
      playSound("win");
    }
  }, [gameBoard]);

  // Confetti effect trigger
  useEffect(() => {
    if (confettiActive && confettiCanvasRef.current) {
      const cleanup = startConfetti(confettiCanvasRef.current);
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [confettiActive, gameCompleted]);

  // Columns & Rows calculation
  const getGridConfig = () => {
    if (gridOption === 6) return { cols: 3, rows: 2 };
    if (gridOption === 12) return { cols: 4, rows: 3 };
    return { cols: 3, rows: 3 }; // 9 pieces default
  };

  const { cols, rows } = getGridConfig();
  const N = cols * rows;

  // Generate procedural illustration
  function generateDefaultImage(): string {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    
    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 600);
    skyGrad.addColorStop(0, "#0f172a"); // Dark slate
    skyGrad.addColorStop(0.3, "#1e1b4b"); // Deep blue-indigo
    skyGrad.addColorStop(0.6, "#4c1d95"); // Purple
    skyGrad.addColorStop(0.8, "#b91c1c"); // Crimson sunset red
    skyGrad.addColorStop(1, "#f59e0b"); // Warm amber
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 600, 600);
    
    // Stars
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 600;
      const y = Math.random() * 300;
      const size = Math.random() * 1.5 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Glowing Moon / Sun
    ctx.beginPath();
    const moonGrad = ctx.createRadialGradient(300, 320, 10, 300, 320, 80);
    moonGrad.addColorStop(0, "#ffffff");
    moonGrad.addColorStop(0.2, "#fef08a"); // Light yellow
    moonGrad.addColorStop(0.6, "#f97316"); // Orange
    moonGrad.addColorStop(1, "transparent");
    ctx.fillStyle = moonGrad;
    ctx.arc(300, 320, 80, 0, Math.PI * 2);
    ctx.fill();
    
    // Mountains
    // Mountain 1 (Back)
    ctx.fillStyle = "#1e1b4b";
    ctx.beginPath();
    ctx.moveTo(0, 600);
    ctx.lineTo(0, 480);
    ctx.quadraticCurveTo(150, 380, 300, 480);
    ctx.quadraticCurveTo(450, 560, 600, 420);
    ctx.lineTo(600, 600);
    ctx.fill();
    
    // Mountain 2 (Middle)
    ctx.fillStyle = "#311042";
    ctx.beginPath();
    ctx.moveTo(0, 600);
    ctx.lineTo(0, 520);
    ctx.bezierCurveTo(120, 470, 240, 440, 360, 510);
    ctx.bezierCurveTo(460, 550, 530, 500, 600, 530);
    ctx.lineTo(600, 600);
    ctx.fill();
    
    // Mountain 3 (Front Ground)
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.moveTo(0, 600);
    ctx.lineTo(0, 560);
    ctx.quadraticCurveTo(150, 520, 320, 560);
    ctx.quadraticCurveTo(460, 580, 600, 550);
    ctx.lineTo(600, 600);
    ctx.fill();
    
    // Cozy Cabin
    ctx.fillStyle = "#38bdf8"; // Light blue body
    ctx.fillRect(430, 520, 50, 45);
    
    ctx.fillStyle = "#ea580c"; // Orange roof
    ctx.beginPath();
    ctx.moveTo(420, 520);
    ctx.lineTo(455, 490);
    ctx.lineTo(490, 520);
    ctx.fill();
    
    ctx.fillStyle = "#fef08a"; // Cozy glowing yellow window
    ctx.fillRect(445, 530, 20, 18);
    
    // Chimney smoke
    ctx.fillStyle = "#4b5563";
    ctx.fillRect(475, 500, 8, 15);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.arc(480, 485, 8, 0, Math.PI * 2);
    ctx.arc(485, 470, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Cute Pine Tree
    ctx.fillStyle = "#78350f"; // Trunk
    ctx.fillRect(110, 490, 10, 70);
    
    // Pine Foliage
    ctx.fillStyle = "#064e3b"; // Dark green
    ctx.beginPath();
    ctx.moveTo(85, 510);
    ctx.lineTo(115, 450);
    ctx.lineTo(145, 510);
    ctx.fill();
    
    ctx.fillStyle = "#065f46"; // Medium green
    ctx.beginPath();
    ctx.moveTo(92, 470);
    ctx.lineTo(115, 420);
    ctx.lineTo(138, 470);
    ctx.fill();
    
    ctx.fillStyle = "#0f766e"; // Lighter pine green
    ctx.beginPath();
    ctx.moveTo(98, 430);
    ctx.lineTo(115, 390);
    ctx.lineTo(132, 430);
    ctx.fill();
    
    // Snow details on branches
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(115, 390, 4, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas.toDataURL();
  }

  // Generate math operations & scrambled permutation
  const generatePuzzle = () => {
    // 1. Generate math equations
    const ops = generateOperations(N, difficulty);
    setOperations(ops);
    
    // 2. Generate scrambled permutation with EXACTLY 2 fixed points
    const perm = generatePermutation(N);
    setPermutation(perm);
    
    // 3. Reset game board
    setGameBoard(new Array(N).fill(null));
    setSelectedPieceIndex(null);
    setGameCompleted(false);
    setConfettiActive(false);
  };

  // Math equations generator logic
  function generateOperations(count: number, diff: "easy" | "medium" | "hard"): Operation[] {
    const ops: Operation[] = [];
    const resultsSet = new Set<number>();
    
    while (ops.length < count) {
      let expression = "";
      let result = 0;
      let verticalParts: Operation["verticalParts"] = undefined;
      
      if (diff === "easy") {
        const isSum = Math.random() > 0.5;
        if (isSum) {
          const resVal = Math.floor(Math.random() * 80) + 20; // Result between 20 and 99
          const b = Math.floor(Math.random() * (resVal - 10)) + 5;
          const a = resVal - b;
          result = resVal;
          expression = `${a} + ${b}`;
          verticalParts = {
            top: a.toString(),
            bottom: b.toString(),
            operator: "+"
          };
        } else {
          const a = Math.floor(Math.random() * 80) + 40; // a between 40 and 119
          const b = Math.floor(Math.random() * (a - 15)) + 10;
          result = a - b;
          expression = `${a} - ${b}`;
          verticalParts = {
            top: a.toString(),
            bottom: b.toString(),
            operator: "-"
          };
        }
      } else if (diff === "medium") {
        const opType = Math.floor(Math.random() * 4);
        if (opType === 0) {
          // a * b + c
          const a = Math.floor(Math.random() * 8) + 2;
          const b = Math.floor(Math.random() * 8) + 2;
          const c = Math.floor(Math.random() * 30) + 1;
          result = a * b + c;
          expression = `${a} × ${b} + ${c}`;
        } else if (opType === 1) {
          // a * b - c
          const a = Math.floor(Math.random() * 8) + 2;
          const b = Math.floor(Math.random() * 8) + 2;
          const c = Math.floor(Math.random() * (a * b - 5)) + 1;
          result = a * b - c;
          expression = `${a} × ${b} - ${c}`;
        } else if (opType === 2) {
          // a / b + c
          const b = Math.floor(Math.random() * 7) + 2;
          const k = Math.floor(Math.random() * 10) + 2;
          const a = b * k;
          const c = Math.floor(Math.random() * 30) + 1;
          result = k + c;
          expression = `${a} ÷ ${b} + ${c}`;
        } else {
          // a / b - c
          const b = Math.floor(Math.random() * 7) + 2;
          const k = Math.floor(Math.random() * 10) + 5;
          const a = b * k;
          const c = Math.floor(Math.random() * (k - 2)) + 1;
          result = k - c;
          expression = `${a} ÷ ${b} - ${c}`;
        }
      } else {
        // hard: combined operations
        const opType = Math.floor(Math.random() * 4);
        if (opType === 0) {
          // (a + b) * c
          const a = Math.floor(Math.random() * 9) + 2;
          const b = Math.floor(Math.random() * 9) + 2;
          const c = Math.floor(Math.random() * 5) + 2;
          result = (a + b) * c;
          expression = `(${a} + ${b}) × ${c}`;
        } else if (opType === 1) {
          // (a - b) * c
          const a = Math.floor(Math.random() * 15) + 8;
          const b = Math.floor(Math.random() * (a - 3)) + 2;
          const c = Math.floor(Math.random() * 5) + 2;
          result = (a - b) * c;
          expression = `(${a} - ${b}) × ${c}`;
        } else if (opType === 2) {
          // (a + b) / c
          const c = Math.floor(Math.random() * 6) + 2;
          const k = Math.floor(Math.random() * 12) + 2;
          const sum = c * k;
          const a = Math.floor(Math.random() * (sum - 2)) + 1;
          const b = sum - a;
          result = k;
          expression = `(${a} + ${b}) ÷ ${c}`;
        } else {
          // a * b - c * d
          const a = Math.floor(Math.random() * 8) + 3;
          const b = Math.floor(Math.random() * 8) + 3;
          const c = Math.floor(Math.random() * 5) + 2;
          const d = Math.floor(Math.random() * 5) + 2;
          const m1 = a * b;
          const m2 = c * d;
          if (m1 > m2 + 5) {
            result = m1 - m2;
            expression = `${a} × ${b} - ${c} × ${d}`;
          } else {
            result = m2 - m1;
            expression = `${c} × ${d} - ${a} × ${b}`;
          }
        }
      }
      
      if (result > 0 && result < 250 && !resultsSet.has(result)) {
        resultsSet.add(result);
        ops.push({ expression, result, verticalParts });
      }
    }
    
    return ops;
  }

  // Generates permutation with EXACTLY 2 fixed points
  function generatePermutation(size: number): number[] {
    const indices = Array.from({ length: size }, (_, i) => i);
    
    // 1. Pick exactly 2 indices to be fixed points
    const fp1 = Math.floor(Math.random() * size);
    let fp2 = Math.floor(Math.random() * size);
    while (fp2 === fp1) {
      fp2 = Math.floor(Math.random() * size);
    }
    
    const fixedPoints = [fp1, fp2];
    const remaining = indices.filter(i => !fixedPoints.includes(i));
    
    // 2. Derange the remaining elements
    let derangement: number[] = [];
    let isDerangement = false;
    let attempts = 0;
    
    while (!isDerangement && attempts < 200) {
      attempts++;
      const shuffled = [...remaining];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      isDerangement = true;
      for (let i = 0; i < remaining.length; i++) {
        if (shuffled[i] === remaining[i]) {
          isDerangement = false;
          break;
        }
      }
      if (isDerangement) {
        derangement = shuffled;
      }
    }
    
    // 3. Assemble
    const P = new Array<number>(size);
    P[fp1] = fp1;
    P[fp2] = fp2;
    
    let dIdx = 0;
    for (let i = 0; i < size; i++) {
      if (i !== fp1 && i !== fp2) {
        P[i] = derangement[dIdx++];
      }
    }
    
    return P;
  }

  // Slice image using HTML Canvas
  const sliceImage = () => {
    if (!image || permutation.length === 0) return;
    
    const imgObj = new Image();
    imgObj.crossOrigin = "anonymous";
    imgObj.src = image;
    imgObj.onload = () => {
      const cellW = imgObj.width / cols;
      const cellH = imgObj.height / rows;
      
      const newSliced: string[] = [];
      
      for (let i = 0; i < N; i++) {
        // We crop the piece corresponding to the grid index
        const c = i % cols;
        const r = Math.floor(i / cols);
        
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = cellW;
        tempCanvas.height = cellH;
        const tempCtx = tempCanvas.getContext("2d");
        
        if (tempCtx) {
          tempCtx.drawImage(
            imgObj,
            c * cellW, r * cellH, cellW, cellH, // source
            0, 0, cellW, cellH // dest
          );
          newSliced.push(tempCanvas.toDataURL());
        }
      }
      setSlicedPieces(newSliced);
    };
  };

  // Drag and Drop handlers for interactive game
  const handleDragStart = (e: React.DragEvent, pieceIdx: number) => {
    e.dataTransfer.setData("text/plain", pieceIdx.toString());
  };

  const handleDrop = (e: React.DragEvent, boardIdx: number) => {
    e.preventDefault();
    const pieceIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
    placePiece(pieceIdx, boardIdx);
  };

  const placePiece = (pieceIdx: number, boardIdx: number) => {
    // Check if the piece's result matches the operation on board cell boardIdx
    const targetResult = operations[boardIdx]?.result;
    const pieceResult = operations[pieceIdx]?.result;
    
    if (targetResult === pieceResult) {
      const newBoard = [...gameBoard];
      newBoard[boardIdx] = pieceIdx;
      setGameBoard(newBoard);
      playSound("success");
      
      if (selectedPieceIndex === pieceIdx) {
        setSelectedPieceIndex(null);
      }
    } else {
      playSound("fail");
      // Add brief shake animation by class target
      const element = document.getElementById(`board-cell-${boardIdx}`);
      if (element) {
        element.classList.add("animate-shake", "border-red-500");
        setTimeout(() => {
          element.classList.remove("animate-shake", "border-red-500");
        }, 500);
      }
    }
  };

  // Click-to-place handler (mobile/alternative accessibility)
  const handleCellClick = (boardIdx: number) => {
    if (selectedPieceIndex !== null) {
      placePiece(selectedPieceIndex, boardIdx);
    }
  };

  // Sound generator
  const playSound = (type: "success" | "fail" | "win") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (type === "success") {
        const notes = [261.63, 329.63, 523.25]; // C4, E4, C5
        notes.forEach((freq, index) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.08);
          
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime + index * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.08 + 0.12);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(audioCtx.currentTime + index * 0.08);
          osc.stop(audioCtx.currentTime + index * 0.08 + 0.15);
        });
      } else if (type === "fail") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, audioCtx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.22);
      } else if (type === "win") {
        const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25, 659.25];
        const durations = [0.08, 0.08, 0.08, 0.12, 0.08, 0.08, 0.25];
        let time = audioCtx.currentTime;
        notes.forEach((freq, index) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, time);
          
          gain.gain.setValueAtTime(0.15, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + durations[index]);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(time);
          osc.stop(time + durations[index] + 0.05);
          time += durations[index];
        });
      }
    } catch (e) {
      console.warn("Audio Context failed to initialize: ", e);
    }
  };

  // Confetti script
  const startConfetti = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 600;
    
    const colors = ["#f43f5e", "#3b82f6", "#10b981", "#eab308", "#a855f7", "#ff7849"];
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: Math.random() * 4 - 2,
      speedY: Math.random() * 4 + 3,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 8 - 4
    }));
    
    let animId: number;
    function run() {
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      
      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;
        
        if (p.y < canvas.height) {
          active = true;
        }
        
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx!.restore();
      });
      
      if (active) {
        animId = requestAnimationFrame(run);
      } else {
        setConfettiActive(false);
      }
    }
    
    run();
    return () => cancelAnimationFrame(animId);
  };

  // Image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Auto-solve the game
  const autoSolve = () => {
    const solved = Array.from({ length: N }, (_, i) => i);
    setGameBoard(solved);
    playSound("win");
  };

  // Reset/Restart interactive game
  const resetGame = () => {
    setGameBoard(new Array(N).fill(null));
    setSelectedPieceIndex(null);
    setGameCompleted(false);
    setConfettiActive(false);
  };

  // Canvas drawings for download
  const renderCanvasSheet = (type: "board" | "pieces" | "combined"): Promise<string> => {
    return new Promise((resolve) => {
      const imgObj = new Image();
      imgObj.crossOrigin = "anonymous";
      imgObj.src = image;
      
      imgObj.onload = () => {
        const dpr = 2; // high res scale
        const a4Width = 1200 * dpr;
        const a4Height = 1697 * dpr; // aspect ratio 1:1.414
        
        const canvas = document.createElement("canvas");
        
        if (type === "combined" && orientation === "side-by-side") {
          canvas.width = a4Height;
          canvas.height = a4Width;
        } else {
          canvas.width = a4Width;
          canvas.height = a4Height;
        }
        
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve("");
        
        ctx.scale(dpr, dpr);
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        
        // Background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        
        // Helper to draw grid
        const drawGridOnCanvas = (
          offsetX: number,
          offsetY: number,
          gridW: number,
          gridH: number,
          gridType: "board" | "pieces"
        ) => {
          const cW = gridW / cols;
          const cH = gridH / rows;
          
          // Draw image pieces if it's the pieces grid
          if (gridType === "pieces") {
            for (let j = 0; j < N; j++) {
              const srcIdx = permutation[j]; // which slice we draw here
              const srcC = srcIdx % cols;
              const srcR = Math.floor(srcIdx / cols);
              
              const destC = j % cols;
              const destR = Math.floor(j / cols);
              
              // Draw image slice
              ctx.drawImage(
                imgObj,
                srcC * (imgObj.width / cols), srcR * (imgObj.height / rows),
                imgObj.width / cols, imgObj.height / rows,
                offsetX + destC * cW, offsetY + destR * cH,
                cW, cH
              );
              
              // Draw cutting guide (dashed border) inside the cell
              ctx.strokeStyle = "#94a3b8";
              ctx.lineWidth = 1;
              ctx.setLineDash([6, 4]);
              ctx.strokeRect(offsetX + destC * cW, offsetY + destR * cH, cW, cH);
              
              // Draw result number badge
              const resultVal = operations[srcIdx]?.result;
              if (resultVal !== undefined) {
                ctx.save();
                ctx.setLineDash([]); // Reset dash for text background
                
                // badge position coordinates
                let badgeX = offsetX + destC * cW + cW / 2;
                let badgeY = offsetY + destR * cH + cH / 2;
                let textAnchor: CanvasTextAlign = "center";
                let badgeR = 18;
                
                if (badgePosition === "top-right") {
                  badgeX = offsetX + destC * cW + cW - 24;
                  badgeY = offsetY + destR * cH + 24;
                } else if (badgePosition === "top-left") {
                  badgeX = offsetX + destC * cW + 24;
                  badgeY = offsetY + destR * cH + 24;
                }
                
                // Draw badge background
                ctx.beginPath();
                ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
                
                // Hex to rgba helper
                const bgRgb = hexToRgb(badgeBgColor) || { r: 255, g: 255, b: 255 };
                ctx.fillStyle = `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${badgeBgOpacity})`;
                ctx.fill();
                
                // Badge border
                ctx.strokeStyle = "#475569";
                ctx.lineWidth = 1.5;
                ctx.stroke();
                
                // Draw badge text
                ctx.fillStyle = badgeTextColor;
                ctx.font = "bold 16px Inter, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(resultVal.toString(), badgeX, badgeY);
                ctx.restore();
              }
            }
            
            // Draw scissors icon indicator
            ctx.save();
            ctx.fillStyle = "#475569";
            ctx.font = "14px sans-serif";
            ctx.fillText("✂️ Recortar las fichas", offsetX, offsetY - 8);
            ctx.restore();
          } else {
            // Draw Board (Operations Grid)
            for (let i = 0; i < N; i++) {
              const destC = i % cols;
              const destR = Math.floor(i / cols);
              const x = offsetX + destC * cW;
              const y = offsetY + destR * cH;
              
              // Cell border
              ctx.strokeStyle = "#0f172a";
              ctx.lineWidth = 2;
              ctx.setLineDash([]);
              ctx.strokeRect(x, y, cW, cH);
              
              // Draw operation text
              const op = operations[i];
              if (op) {
                ctx.save();
                ctx.fillStyle = "#0f172a";
                
                if (format === "vertical" && op.verticalParts) {
                  // Classical math columns vertical format
                  ctx.font = "26px monospace";
                  ctx.textAlign = "right";
                  ctx.textBaseline = "middle";
                  
                  const topNum = op.verticalParts.top;
                  const bottomNum = op.verticalParts.bottom;
                  const operator = op.verticalParts.operator;
                  
                  // Center vertical offset
                  const centerY = y + cH / 2;
                  const rightX = x + cW / 2 + 30; // Shift slightly right of center for nice aesthetic
                  
                  ctx.fillText(topNum, rightX, centerY - 25);
                  ctx.fillText(operator + " " + bottomNum, rightX, centerY + 5);
                  
                  // Horizontal line
                  ctx.beginPath();
                  ctx.moveTo(x + cW / 2 - 40, centerY + 20);
                  ctx.lineTo(rightX + 10, centerY + 20);
                  ctx.strokeStyle = "#0f172a";
                  ctx.lineWidth = 2.5;
                  ctx.stroke();
                } else {
                  // Horizontal standard format
                  ctx.font = "bold 24px Inter, sans-serif";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(op.expression, x + cW / 2, y + cH / 2);
                }
                ctx.restore();
              }
            }
          }
        };

        // Draw headers and grid layout
        if (type === "board") {
          // Title
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 32px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(customTitle, w / 2, 80);
          
          // Subtitle
          ctx.font = "16px Inter, sans-serif";
          ctx.fillStyle = "#475569";
          ctx.fillText(customSubtitle, w / 2, 115);
          
          // Outer borders
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 4;
          ctx.strokeRect(50, 150, w - 100, h - 250);
          
          // Draw board grid
          drawGridOnCanvas(65, 165, w - 130, h - 280, "board");
          
          // Footer
          ctx.font = "14px Inter, sans-serif";
          ctx.fillStyle = "#94a3b8";
          ctx.textAlign = "center";
          ctx.fillText("Generado con RompeImages • www.rompeimages.com", w / 2, h - 40);
          
        } else if (type === "pieces") {
          // Title
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 32px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Fichas de la Imagen (Resultados)", w / 2, 80);
          
          // Subtitle
          ctx.font = "16px Inter, sans-serif";
          ctx.fillStyle = "#475569";
          ctx.fillText("Recorta cada recuadro por las líneas punteadas y pégalo en el tablero.", w / 2, 115);
          
          // Outer borders
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 2;
          ctx.strokeRect(50, 150, w - 100, h - 250);
          
          // Draw pieces grid
          drawGridOnCanvas(65, 165, w - 130, h - 280, "pieces");
          
          // Footer
          ctx.font = "14px Inter, sans-serif";
          ctx.fillStyle = "#94a3b8";
          ctx.textAlign = "center";
          ctx.fillText("Generado con RompeImages • www.rompeimages.com", w / 2, h - 40);
          
        } else if (type === "combined") {
          // Combined layout: stacked or side-by-side
          if (orientation === "stacked") {
            // Title
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 26px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(customTitle, w / 2, 50);
            ctx.font = "14px Inter, sans-serif";
            ctx.fillStyle = "#475569";
            ctx.fillText(customSubtitle, w / 2, 75);
            
            // Grid 1 (Board) - Top Half
            ctx.font = "bold 16px Inter, sans-serif";
            ctx.fillStyle = "#0f172a";
            ctx.fillText("1. TABLERO DE EJERCICIOS", w / 2, 110);
            drawGridOnCanvas(75, 130, w - 150, (h - 260) / 2, "board");
            
            // Separation cutting line
            ctx.beginPath();
            ctx.moveTo(30, h / 2 + 10);
            ctx.lineTo(w - 30, h / 2 + 10);
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([12, 6]);
            ctx.stroke();
            
            // Grid 2 (Pieces) - Bottom Half
            ctx.setLineDash([]);
            ctx.font = "bold 16px Inter, sans-serif";
            ctx.fillStyle = "#0f172a";
            ctx.fillText("2. FICHAS PARA RECORTAR (RESULTADOS)", w / 2, h / 2 + 45);
            drawGridOnCanvas(75, h / 2 + 65, w - 150, (h - 260) / 2, "pieces");
            
            // Footer
            ctx.font = "12px Inter, sans-serif";
            ctx.fillStyle = "#94a3b8";
            ctx.fillText("RompeImages • www.rompeimages.com", w / 2, h - 25);
          } else {
            // Landscape layout (side-by-side)
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 28px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(customTitle, w / 2, 45);
            ctx.font = "14px Inter, sans-serif";
            ctx.fillStyle = "#475569";
            ctx.fillText(customSubtitle, w / 2, 65);
            
            // Left Grid (Board)
            ctx.font = "bold 16px Inter, sans-serif";
            ctx.fillStyle = "#0f172a";
            ctx.fillText("TABLERO DE OPERACIONES", w / 4 + 20, 100);
            drawGridOnCanvas(50, 120, w / 2 - 90, h - 170, "board");
            
            // Center separator line
            ctx.beginPath();
            ctx.moveTo(w / 2, 90);
            ctx.lineTo(w / 2, h - 50);
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([12, 6]);
            ctx.stroke();
            
            // Right Grid (Pieces)
            ctx.setLineDash([]);
            ctx.font = "bold 16px Inter, sans-serif";
            ctx.fillStyle = "#0f172a";
            ctx.fillText("FICHAS PARA RECORTAR", (3 * w) / 4 - 20, 100);
            drawGridOnCanvas(w / 2 + 40, 120, w / 2 - 90, h - 170, "pieces");
            
            // Footer
            ctx.font = "12px Inter, sans-serif";
            ctx.fillStyle = "#94a3b8";
            ctx.fillText("RompeImages • www.rompeimages.com", w / 2, h - 25);
          }
        }
        
        resolve(canvas.toDataURL("image/png"));
      };
    });
  };

  const handleDownload = async (type: "board" | "pieces" | "combined") => {
    const dataUrl = await renderCanvasSheet(type);
    if (!dataUrl) return;
    
    const link = document.createElement("a");
    link.href = dataUrl;
    
    let filename = "rompeimages_tablero.png";
    if (type === "pieces") filename = "rompeimages_fichas.png";
    if (type === "combined") filename = "rompeimages_completo.png";
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper color parsers
  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }

  // Pre-fill styles helper
  const handleBadgeColorPreset = (preset: { bg: string; text: string; opacity: number }) => {
    setBadgeBgColor(preset.bg);
    setBadgeTextColor(preset.text);
    setBadgeBgOpacity(preset.opacity);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans">
      {/* Background stars canvas for extra wow factor in dark mode */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-75 transition-opacity">
        <div className="stars-layer"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/30 text-white animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                RompeImages
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Diseñador de rompecabezas educativos de matemáticas
              </p>
            </div>
          </div>
          
          {/* Main Tabs */}
          <div className="flex bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl backdrop-blur-sm border border-slate-300/35 dark:border-slate-700/50">
            <button
              onClick={() => setActiveTab("print")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "print"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              📑 Diseñar e Imprimir
            </button>
            <button
              onClick={() => {
                setActiveTab("game");
                resetGame();
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "game"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              🎮 Modo Interactivo
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Settings Panel (4 cols) */}
          <section className="lg:col-span-4 bg-white/80 dark:bg-slate-800/85 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl shadow-slate-100/50 dark:shadow-none backdrop-blur-md space-y-6">
            <h2 className="text-xl font-bold border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
              ⚙️ Ajustes del Rompecabezas
            </h2>
            
            {/* 1. Upload Section */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Imagen del Rompecabezas
              </label>
              <div className="group relative flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-slate-50/50 dark:bg-slate-900/30">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Arrastra o haz clic para subir imagen
                </p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG hasta 5MB</p>
              </div>
              
              {/* Reset to procedural image button */}
              <button
                onClick={() => setImage(generateDefaultImage())}
                className="w-full text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex justify-center items-center gap-1.5 pt-1"
              >
                🔄 Restaurar imagen ilustrada de ejemplo
              </button>
            </div>

            {/* 2. Grid Size Division Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Número de Piezas
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[6, 9, 12].map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridOption(size as 6 | 9 | 12)}
                    className={`py-2 px-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                      gridOption === size
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                        : "bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {size} piezas
                    <span className="block text-[10px] opacity-75 font-normal">
                      {size === 6 ? "3x2" : size === 9 ? "3x3" : "4x3"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Difficulty */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Dificultad de los Ejercicios
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="easy">🟢 Fácil (Sumas y Restas simples)</option>
                <option value="medium">🟡 Medio (Aritmética básica)</option>
                <option value="hard">🔴 Difícil (Combinados con paréntesis)</option>
              </select>
            </div>

            {/* 4. Operations Format */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Formato de Operación
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setFormat("horizontal")}
                  disabled={difficulty !== "easy"}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    format === "horizontal" || difficulty !== "easy"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                  } ${difficulty !== "easy" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Horizontal (5 + 7)
                </button>
                <button
                  onClick={() => setFormat("vertical")}
                  disabled={difficulty !== "easy"}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    format === "vertical" && difficulty === "easy"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                  } ${difficulty !== "easy" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Vertical (Columna)
                </button>
              </div>
              {difficulty !== "easy" && (
                <p className="text-[10px] text-amber-500">
                  ⚠️ El formato vertical clásico solo se habilita en dificultad Fácil (Suma y Resta).
                </p>
              )}
            </div>

            {/* 5. Custom Titles (Only relevant in print mode) */}
            {activeTab === "print" && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Textos de Impresión
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Título del Tablero"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Subtítulo / Instrucciones"
                    value={customSubtitle}
                    onChange={(e) => setCustomSubtitle(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* 6. Badge result styles */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Estilo de Fichas (Resultados)
              </label>
              
              <div className="space-y-2">
                <span className="block text-xs text-slate-500">Posición del número:</span>
                <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  {(["top-right", "top-left", "center"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setBadgePosition(pos)}
                      className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${
                        badgePosition === pos
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {pos === "top-right" ? "Esq. Der" : pos === "top-left" ? "Esq. Izq" : "Centro"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Styled Badge Presets */}
              <div className="space-y-2">
                <span className="block text-xs text-slate-500">Ajustar colores:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => handleBadgeColorPreset({ bg: "#ffffff", text: "#000000", opacity: 0.9 })}
                    className="p-1 text-[10px] bg-white border border-slate-200 text-slate-800 rounded font-medium hover:bg-slate-50"
                  >
                    Clásico
                  </button>
                  <button
                    onClick={() => handleBadgeColorPreset({ bg: "#000000", text: "#ffffff", opacity: 0.7 })}
                    className="p-1 text-[10px] bg-slate-800 text-white rounded font-medium hover:bg-slate-900"
                  >
                    Oscuro
                  </button>
                  <button
                    onClick={() => handleBadgeColorPreset({ bg: "#fef08a", text: "#854d0e", opacity: 0.9 })}
                    className="p-1 text-[10px] bg-yellow-200 text-yellow-800 rounded font-medium hover:bg-yellow-300"
                  >
                    Escolar
                  </button>
                  <button
                    onClick={() => handleBadgeColorPreset({ bg: "#f43f5e", text: "#ffffff", opacity: 0.95 })}
                    className="p-1 text-[10px] bg-rose-500 text-white rounded font-medium hover:bg-rose-600"
                  >
                    Vistoso
                  </button>
                </div>
              </div>

              {/* Opacity slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Opacidad del fondo:</span>
                  <span>{Math.round(badgeBgOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={badgeBgOpacity}
                  onChange={(e) => setBadgeBgOpacity(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Regenerate Button */}
            <button
              onClick={generatePuzzle}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2 text-sm"
            >
              🎲 Cambiar Operaciones y Mezclar
            </button>
          </section>

          {/* Main Preview/Game Workspace (8 cols) */}
          <main className="lg:col-span-8 space-y-6">
            
            {activeTab === "print" ? (
              /* TAB: PRINT AND DESIGN VIEW */
              <div className="space-y-6">
                
                {/* Print Control panel */}
                <div className="bg-white/80 dark:bg-slate-800/85 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl shadow-slate-100/50 dark:shadow-none backdrop-blur-md flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-500">Ajuste de Impresión:</span>
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setOrientation("side-by-side")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          orientation === "side-by-side"
                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        Horizontal (Lado a Lado)
                      </button>
                      <button
                        onClick={() => setOrientation("stacked")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          orientation === "stacked"
                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        Vertical (Uno sobre Otro)
                      </button>
                    </div>
                  </div>
                  
                  {/* Solution toggle */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 cursor-pointer" htmlFor="solution-toggle">
                      👁️ Mostrar Solución:
                    </label>
                    <input
                      id="solution-toggle"
                      type="checkbox"
                      checked={showSolution}
                      onChange={(e) => setShowSolution(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Live Preview Wrapper */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* 1. Tablero (Exercises sheet) */}
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/70 text-slate-900 flex flex-col justify-between">
                    <div>
                      {/* Paper Header */}
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900">{customTitle || "Rompecabezas"}</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{customSubtitle}</p>
                      </div>
                      
                      {/* Operation Grid Container */}
                      <div 
                        className="grid gap-0 border-2 border-slate-900 rounded-lg overflow-hidden bg-slate-50"
                        style={{
                          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                        }}
                      >
                        {operations.map((op, idx) => {
                          const isFixedPoint = permutation[idx] === idx;
                          return (
                            <div
                              key={idx}
                              className={`aspect-square border border-slate-950 flex flex-col items-center justify-center p-2 relative overflow-hidden bg-white ${
                                showSolution && isFixedPoint ? "ring-4 ring-emerald-500 ring-inset bg-emerald-50" : ""
                              }`}
                            >
                              {/* Exercise text */}
                              {format === "vertical" && op.verticalParts ? (
                                <div className="flex flex-col items-end justify-center font-mono text-lg select-none leading-tight pb-1 pr-1">
                                  <div className="tracking-widest">{op.verticalParts.top}</div>
                                  <div className="flex justify-between w-full min-w-[50px]">
                                    <span className="mr-3">{op.verticalParts.operator}</span>
                                    <span>{op.verticalParts.bottom}</span>
                                  </div>
                                  <div className="w-full border-b border-slate-950 my-0.5"></div>
                                </div>
                              ) : (
                                <span className="font-bold text-lg select-none text-slate-900">{op.expression}</span>
                              )}
                              
                              {/* Solution helper */}
                              {showSolution && (
                                <div className="absolute bottom-1 right-1 text-[9px] font-bold text-slate-400 bg-slate-100 px-1 rounded flex flex-col items-end">
                                  <span>Ans: {op.result}</span>
                                  <span className={isFixedPoint ? "text-emerald-600 font-extrabold" : ""}>
                                    {isFixedPoint ? "¡Coincide!" : `Va en pieza: ${permutation.indexOf(idx)}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="text-center text-[10px] text-slate-400 mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span>RompeImages.com</span>
                      <button
                        onClick={() => handleDownload("board")}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-3 rounded-lg font-bold flex items-center gap-1 active:scale-95 transition-all"
                      >
                        📥 Guardar Tablero
                      </button>
                    </div>
                  </div>

                  {/* 2. Fichas (Pieces sheet with scrambled fragments) */}
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/70 text-slate-900 flex flex-col justify-between">
                    <div>
                      {/* Paper Header */}
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900">Fichas del Rompecabezas</h3>
                        <p className="text-xs text-slate-500 font-medium">Recorta las fichas por la línea de puntos y pégalas en el tablero.</p>
                      </div>
                      
                      {/* Scrambled image grid */}
                      <div
                        className="grid gap-0 border-2 border-slate-400 rounded-lg overflow-hidden bg-slate-100"
                        style={{
                          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                        }}
                      >
                        {Array.from({ length: N }).map((_, j) => {
                          const pieceIdx = permutation[j]; // which slice is printed here
                          const targetResult = operations[pieceIdx]?.result;
                          const sliceDataUrl = slicedPieces[pieceIdx];
                          const isFixedPoint = pieceIdx === j;
                          
                          return (
                            <div
                              key={j}
                              className={`aspect-square border border-dashed border-slate-350 relative flex items-center justify-center overflow-hidden bg-slate-200 group ${
                                showSolution && isFixedPoint ? "ring-4 ring-emerald-500 ring-inset bg-emerald-50" : ""
                              }`}
                            >
                              {/* Scissors line guide */}
                              <div className="absolute top-0.5 left-0.5 text-[8px] opacity-30 select-none pointer-events-none">✂️</div>
                              
                              {/* Background slice image */}
                              {sliceDataUrl ? (
                                <img
                                  src={sliceDataUrl}
                                  alt={`Ficha ${j}`}
                                  className="w-full h-full object-cover select-none pointer-events-none"
                                />
                              ) : (
                                <div className="text-[10px] text-slate-400">Generando...</div>
                              )}
                              
                              {/* Overlay Result Badge */}
                              {targetResult !== undefined && (
                                <div
                                  className="absolute select-none shadow"
                                  style={{
                                    top: badgePosition === "center" ? "50%" : "8px",
                                    left: badgePosition === "center" ? "50%" : badgePosition === "top-left" ? "8px" : "auto",
                                    right: badgePosition === "top-right" ? "8px" : "auto",
                                    transform: badgePosition === "center" ? "translate(-50%, -50%)" : "none",
                                    backgroundColor: badgeBgColor,
                                    color: badgeTextColor,
                                    opacity: badgeBgOpacity,
                                    borderRadius: "9999px",
                                    width: "28px",
                                    height: "28px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    border: "1.5px solid #475569"
                                  }}
                                >
                                  {targetResult}
                                </div>
                              )}
                              
                              {/* Solution marker */}
                              {showSolution && (
                                <div className="absolute bottom-1 left-1 text-[9px] font-bold text-slate-800 bg-white/95 px-1.5 py-0.5 rounded shadow">
                                  {isFixedPoint ? (
                                    <span className="text-emerald-600">🎯 ¡Fija!</span>
                                  ) : (
                                    <span>Pos original: {pieceIdx}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="text-center text-[10px] text-slate-400 mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span>RompeImages.com</span>
                      <button
                        onClick={() => handleDownload("pieces")}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-3 rounded-lg font-bold flex items-center gap-1 active:scale-95 transition-all"
                      >
                        📥 Guardar Fichas
                      </button>
                    </div>
                  </div>

                </div>

                {/* Global Download Buttons */}
                <div className="bg-slate-800 text-white rounded-3xl p-6 shadow-xl border border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h3 className="text-lg font-bold">🖨️ ¿Listo para imprimir en papel?</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-xl">
                      Descarga una única hoja de alta resolución en tamaño A4 con el tablero y las fichas listas para recortar y armar en el aula o el hogar.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload("combined")}
                    className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    📥 Descargar Hoja Completa A4 (PNG)
                  </button>
                </div>
              </div>
            ) : (
              /* TAB: INTERACTIVE PLAY GAME MODE */
              <div className="bg-white/80 dark:bg-slate-800/85 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl backdrop-blur-md space-y-6 relative overflow-hidden">
                
                {/* Victory Canvas Confetti Layer */}
                {confettiActive && (
                  <canvas
                    ref={confettiCanvasRef}
                    className="absolute inset-0 z-40 pointer-events-none w-full h-full"
                  />
                )}
                
                {/* Game controls and score */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      🧩 Rompecabezas Interactivo
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Haz clic en una pieza de la derecha, y luego haz clic en el ejercicio correspondiente en el tablero. ¡O simplemente arrástrala!
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Audio Toggle */}
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 rounded-xl transition-all"
                      title={soundEnabled ? "Desactivar sonido" : "Activar sonido"}
                    >
                      {soundEnabled ? "🔊 Sonido" : "🔇 Silenciado"}
                    </button>
                    
                    {/* Auto Solve */}
                    <button
                      onClick={autoSolve}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl transition-all"
                    >
                      🪄 Auto-Resolver
                    </button>

                    {/* Reset Board */}
                    <button
                      onClick={resetGame}
                      className="px-3 py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all"
                    >
                      🔁 Reiniciar
                    </button>
                  </div>
                </div>

                {/* Victory Overlay Screen */}
                {gameCompleted && (
                  <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 transition-all duration-500 animate-fadeIn">
                    <div className="bg-indigo-600 text-white p-5 rounded-full shadow-2xl animate-bounce mb-4 text-4xl">
                      🏆
                    </div>
                    <h4 className="text-3xl font-extrabold text-white">¡Excelente Trabajo!</h4>
                    <p className="text-slate-300 mt-2 max-w-sm text-sm">
                      Has resuelto correctamente todas las operaciones y reconstruido completamente la imagen.
                    </p>
                    <div className="mt-6 flex gap-4">
                      <button
                        onClick={resetGame}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg active:scale-95"
                      >
                        🎮 Jugar de nuevo
                      </button>
                      <button
                        onClick={generatePuzzle}
                        className="bg-slate-800 hover:bg-slate-750 text-white font-bold py-2.5 px-6 rounded-xl transition-all border border-slate-700 shadow"
                      >
                        🎲 Nuevas operaciones
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Workspace Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Left: The Board (7 cols) */}
                  <div className="md:col-span-7 space-y-3">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      El Tablero (Arrastra o coloca aquí)
                    </span>
                    
                    <div
                      className="grid gap-0 border-3 border-slate-800 dark:border-slate-650 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950/40 shadow-inner"
                      style={{
                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                      }}
                    >
                      {operations.map((op, boardIdx) => {
                        const placedPieceIdx = gameBoard[boardIdx];
                        const hasPiece = placedPieceIdx !== null;
                        const isSelected = selectedPieceIndex !== null && operations[selectedPieceIndex]?.result === op.result;
                        
                        return (
                          <div
                            key={boardIdx}
                            id={`board-cell-${boardIdx}`}
                            onClick={() => handleCellClick(boardIdx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, boardIdx)}
                            className={`aspect-square border border-slate-350 dark:border-slate-850 flex flex-col items-center justify-center p-1.5 relative overflow-hidden cursor-pointer transition-all duration-300 ${
                              hasPiece 
                                ? "bg-white" 
                                : isSelected
                                ? "bg-indigo-50/80 dark:bg-indigo-950/40 ring-4 ring-indigo-500 ring-inset"
                                : "bg-white dark:bg-slate-900 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20"
                            }`}
                          >
                            {hasPiece ? (
                              /* Draw correct image fragment */
                              slicedPieces[placedPieceIdx] ? (
                                <img
                                  src={slicedPieces[placedPieceIdx]}
                                  alt={`Ficha colocada ${placedPieceIdx}`}
                                  className="w-full h-full object-cover pointer-events-none select-none animate-scaleIn"
                                />
                              ) : (
                                <span className="text-xs">OK</span>
                              )
                            ) : (
                              /* Draw Math Operation */
                              <div className="w-full h-full flex flex-col items-center justify-center text-center">
                                {format === "vertical" && op.verticalParts ? (
                                  <div className="flex flex-col items-end justify-center font-mono text-sm sm:text-base select-none leading-none pb-0.5">
                                    <div className="tracking-widest">{op.verticalParts.top}</div>
                                    <div className="flex justify-between w-full min-w-[40px]">
                                      <span className="mr-2 text-indigo-500">{op.verticalParts.operator}</span>
                                      <span>{op.verticalParts.bottom}</span>
                                    </div>
                                    <div className="w-full border-b border-slate-900 dark:border-white my-0.5"></div>
                                  </div>
                                ) : (
                                  <span className="font-extrabold text-sm sm:text-base select-none text-slate-850 dark:text-slate-100">
                                    {op.expression}
                                  </span>
                                )}
                                
                                {/* Light overlay indicator in case a piece is selected */}
                                {selectedPieceIndex !== null && (
                                  <div className="absolute inset-0 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors" />
                                )}
                              </div>
                            )}

                            {/* Small indicator label */}
                            <div className="absolute bottom-0.5 right-1 text-[8px] text-slate-400 dark:text-slate-500 select-none pointer-events-none">
                              {boardIdx + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Available Pieces (5 cols) */}
                  <div className="md:col-span-5 space-y-3">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex justify-between">
                      <span>Fichas Mezcladas</span>
                      <span className="text-indigo-500 dark:text-indigo-400 normal-case">
                        {gameBoard.filter(v => v !== null).length} / {N} Colocadas
                      </span>
                    </span>

                    {/* Draggable scrambled pieces list */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 max-h-[420px] overflow-y-auto">
                      {Array.from({ length: N }).map((_, j) => {
                        const originalPieceIdx = permutation[j];
                        const isPlaced = gameBoard.includes(originalPieceIdx);
                        const isSelected = selectedPieceIndex === originalPieceIdx;
                        const resultVal = operations[originalPieceIdx]?.result;
                        const dataUrl = slicedPieces[originalPieceIdx];
                        
                        return (
                          <div
                            key={j}
                            draggable={!isPlaced}
                            onDragStart={(e) => handleDragStart(e, originalPieceIdx)}
                            onClick={() => {
                              if (!isPlaced) {
                                setSelectedPieceIndex(isSelected ? null : originalPieceIdx);
                              }
                            }}
                            className={`aspect-square rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing border-2 transition-all flex items-center justify-center shadow select-none ${
                              isPlaced
                                ? "opacity-25 border-slate-300 dark:border-slate-800 cursor-not-allowed scale-95"
                                : isSelected
                                ? "border-indigo-600 ring-2 ring-indigo-500/35 ring-offset-2 dark:ring-offset-slate-900 scale-105 shadow-lg shadow-indigo-600/10 z-10"
                                : "border-white dark:border-slate-850 hover:border-indigo-400 hover:scale-102"
                            }`}
                          >
                            {/* Card Content */}
                            {dataUrl ? (
                              <img
                                src={dataUrl}
                                alt={`Pieza ${j}`}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            ) : (
                              <div className="text-xs text-slate-400">...</div>
                            )}

                            {/* Result Indicator Badge overlay */}
                            {resultVal !== undefined && (
                              <div
                                className="absolute select-none shadow-md font-bold text-xs"
                                style={{
                                  top: badgePosition === "center" ? "50%" : "6px",
                                  left: badgePosition === "center" ? "50%" : badgePosition === "top-left" ? "6px" : "auto",
                                  right: badgePosition === "top-right" ? "6px" : "auto",
                                  transform: badgePosition === "center" ? "translate(-50%, -50%)" : "none",
                                  backgroundColor: badgeBgColor,
                                  color: badgeTextColor,
                                  opacity: badgeBgOpacity,
                                  borderRadius: "9999px",
                                  width: "24px",
                                  height: "24px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: "1px solid #475569"
                                }}
                              >
                                {resultVal}
                              </div>
                            )}

                            {/* Click helper marker */}
                            {!isPlaced && isSelected && (
                              <div className="absolute bottom-1 inset-x-1 text-center bg-indigo-600/90 text-white text-[8px] py-0.5 rounded font-extrabold shadow">
                                LISTO
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Instructions panel */}
                    <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/30 rounded-xl">
                      <p className="text-[11px] leading-relaxed text-indigo-700 dark:text-indigo-300">
                        💡 <strong>Consejo:</strong> Si estás en dispositivo táctil (celular o tableta), toca una de las fichas mezcladas de arriba (se marcará en azul) y luego toca la casilla del tablero que tiene la operación que da ese resultado.
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            )}
            
          </main>

        </div>
      </div>
      
      {/* Footer Branding */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>© 2026 RompeImages. Creado con fines educativos y recreativos para maestros y alumnos.</p>
        <p className="mt-2 text-[10px] opacity-75">Hecho con ❤️ para la enseñanza activa de las matemáticas.</p>
      </footer>
    </div>
  );
}
