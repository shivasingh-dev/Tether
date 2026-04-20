import { useState, useRef, useEffect, useCallback } from "react";

// ================================================================
//  ImageEditor.jsx  —  WhatsApp-style Image Editor
//
//  Props:
//    initialImage  (string)    → Object URL ya base64 of image
//    onDone        (function)  → Called with dataURL when user clicks Done
//    onCancel      (function)  → Called when user clicks Cancel / X
//
//  Architecture:
//    origImgRef  → Original Image element (kabhi modify nahi hota)
//    drawCvs     → Offscreen canvas — sirf pencil strokes ki layer
//    texts[]     → Text objects array (state mein, canvas pe "bake" nahi)
//    filterRef   → Current filter string
//
//    renderAll() composites sab kuch:
//      1. origImg + CSS filter
//      2. drawCvs (pencil strokes)
//      3. texts[] (har text object — draggable kyunki array mein hai)
// ================================================================

const FILTERS = [
  { id: "normal",  label: "Normal",  css: "none" },
  { id: "bw",      label: "B&W",     css: "grayscale(100%)" },
  { id: "sepia",   label: "Sepia",   css: "sepia(100%)" },
  { id: "vintage", label: "Vintage", css: "sepia(45%) contrast(88%) brightness(87%) saturate(75%)" },
  { id: "cool",    label: "Cool",    css: "hue-rotate(195deg) saturate(140%) brightness(108%)" },
];

const PALETTE = [
  "#ffffff", "#111111", "#ff4545", "#ffdd22",
  "#44ff99", "#60a5fa", "#a78bfa", "#ff8800",
];

let textIdCounter = 1;

const ImageEditor = ({ initialImage, onDone, onCancel }) => {

  // ── Tool State ──
  const [mode, setMode]           = useState(null);
  const [filter, setFilter]       = useState("normal");
  const [drawColor, setDrawColor] = useState("#60a5fa");
  const [drawSize, setDrawSize]   = useState(4);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize]   = useState(28);
  const [hasCrop, setHasCrop]     = useState(false);

  // ── Text State ──
  const [texts, setTexts]               = useState([]);
  const [selectedId, setSelectedId]     = useState(null);
  const [showTextBox, setShowTextBox]   = useState(false);
  const [textInput, setTextInput]       = useState("");

  // ── Canvas Refs ──
  const canvasRef  = useRef(null);
  const origImgRef = useRef(null);   // Original image — never modified
  const drawCvs    = useRef(null);   // Offscreen canvas: only pencil strokes

  // ── Mutable Refs (event handler closures ke liye stale state problem se bachne ke liye) ──
  const textsRef      = useRef([]);
  const filterRef     = useRef("normal");
  const selectedIdRef = useRef(null);
  const drawColorRef  = useRef("#60a5fa");
  const drawSizeRef   = useRef(4);

  // ── Interaction Refs ──
  const isDrawing   = useRef(false);
  const lastPos     = useRef(null);
  const cropStart   = useRef(null);
  const cropRect    = useRef(null);
  const isCropping  = useRef(false);
  const isDragging  = useRef(false);
  const dragId      = useRef(null);
  const dragOffset  = useRef({ x: 0, y: 0 });
  const pendingPos  = useRef(null);

  // ── State → Ref sync ──
  useEffect(() => { textsRef.current = texts; }, [texts]);
  useEffect(() => { selectedIdRef.current = selectedId; renderAll(); }, [selectedId]);
  useEffect(() => { filterRef.current = filter; renderAll(); }, [filter]);
  useEffect(() => { drawColorRef.current = drawColor; }, [drawColor]);
  useEffect(() => { drawSizeRef.current  = drawSize;  }, [drawSize]);

  // ── Load image when prop changes ──
  useEffect(() => {
    if (initialImage) loadImg(initialImage);
  }, [initialImage]);


  // ================================================================
  //  renderAll()
  //  Puri canvas re-composite karo: image + filter + strokes + texts
  //  Har change pe yahi call hota hai — iska naam hi sab kuch batata hai
  // ================================================================
  const renderAll = useCallback((textsOverride) => {
    const c = canvasRef.current;
    if (!c || !origImgRef.current) return;
    const ctx   = c.getContext("2d");
    const tList = textsOverride !== undefined ? textsOverride : textsRef.current;
    const fCSS  = FILTERS.find(f => f.id === filterRef.current)?.css ?? "none";

    // 1. Original image + CSS filter
    ctx.save();
    ctx.filter = fCSS;
    ctx.drawImage(origImgRef.current, 0, 0, c.width, c.height);
    ctx.restore(); // filter reset

    // 2. Pencil strokes (filter nahi lagta strokes pe)
    if (drawCvs.current) ctx.drawImage(drawCvs.current, 0, 0);

    // 3. Text objects (array se draw hote hain, isliye draggable hain)
    tList.forEach(t => {
      ctx.save();
      ctx.textBaseline = "top";
      ctx.font = `bold ${t.size}px 'Segoe UI', sans-serif`;
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.lineWidth   = Math.max(3, t.size / 7);
      ctx.lineJoin    = "round";
      ctx.strokeText(t.content, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.content, t.x, t.y);
      // Selected text ka bounding box
      if (t.id === selectedIdRef.current) {
        const tw = ctx.measureText(t.content).width;
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth   = 2;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(t.x - 6, t.y - 4, tw + 12, t.size * 1.3 + 4);
        ctx.setLineDash([]);
      }
      ctx.restore();
    });
  }, []);


  // ================================================================
  //  loadImg  —  Image element banao, canvas size set karo
  // ================================================================
  const loadImg = (src) => {
    const img = new Image();
    img.onload = () => {
      const maxW  = Math.min(window.innerWidth - 80, 760);
      const maxH  = Math.min(window.innerHeight - 280, 480);
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const w     = Math.floor(img.width  * ratio);
      const h     = Math.floor(img.height * ratio);

      const c      = canvasRef.current;
      c.width      = w;
      c.height     = h;

      // Pencil strokes ki alag offscreen layer
      drawCvs.current        = document.createElement("canvas");
      drawCvs.current.width  = w;
      drawCvs.current.height = h;

      origImgRef.current    = img;
      textsRef.current      = []; setTexts([]);
      selectedIdRef.current = null; setSelectedId(null);
      renderAll([]);
    };
    img.src = src;
  };


  // ================================================================
  //  hitTestText  —  Click kisi text ke upar hai ya nahi?
  // ================================================================
  const hitTestText = (pos) => {
    const ctx = canvasRef.current.getContext("2d");
    for (let i = textsRef.current.length - 1; i >= 0; i--) {
      const t = textsRef.current[i];
      ctx.font = `bold ${t.size}px 'Segoe UI', sans-serif`;
      const tw = ctx.measureText(t.content).width;
      if (
        pos.x >= t.x - 6  && pos.x <= t.x + tw + 6 &&
        pos.y >= t.y - 4  && pos.y <= t.y + t.size * 1.3 + 4
      ) return t;
    }
    return null;
  };


  // ── Canvas pixel coordinates (CSS aur canvas resolution alag hoti hai) ──
  const getPos = (e) => {
    const c    = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const sx   = c.width  / rect.width;
    const sy   = c.height / rect.height;
    const cx   = e.touches ? e.touches[0].clientX : e.clientX;
    const cy   = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
  };


  const onDown = (e) => {
    const p = getPos(e);
    if (mode === "draw") {
      isDrawing.current = true;
      lastPos.current   = p;
    } else if (mode === "crop") {
      cropStart.current  = p;
      isCropping.current = true;
      setHasCrop(false);
    } else if (mode === "text") {
      const hit = hitTestText(p);
      if (hit) {
        // Existing text — drag karo
        isDragging.current = true;
        dragId.current     = hit.id;
        dragOffset.current = { x: p.x - hit.x, y: p.y - hit.y };
        setSelectedId(hit.id);
      } else {
        // Empty area — naya text add karo
        setSelectedId(null);
        pendingPos.current = p;
        setTextInput("");
        setShowTextBox(true);
      }
    }
  };


  const onMove = (e) => {
    const c   = canvasRef.current;
    const ctx = c.getContext("2d");
    const p   = getPos(e);

    if (mode === "draw" && isDrawing.current) {
      // Strokes offscreen canvas pe jaate hain, renderAll() se visible hote hain
      const dCtx = drawCvs.current.getContext("2d");
      dCtx.beginPath();
      dCtx.strokeStyle = drawColorRef.current;
      dCtx.lineWidth   = drawSizeRef.current;
      dCtx.lineCap     = "round";
      dCtx.lineJoin    = "round";
      dCtx.moveTo(lastPos.current.x, lastPos.current.y);
      dCtx.lineTo(p.x, p.y);
      dCtx.stroke();
      lastPos.current = p;
      renderAll();

    } else if (mode === "crop" && isCropping.current) {
      const x = Math.min(cropStart.current.x, p.x);
      const y = Math.min(cropStart.current.y, p.y);
      const w = Math.abs(p.x - cropStart.current.x);
      const h = Math.abs(p.y - cropStart.current.y);
      cropRect.current = { x, y, w, h };

      renderAll(); // Pehle clean render

      if (w > 2 && h > 2) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, c.width, c.height);

        // Clip trick: selected area ko clearly dikhao
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.filter = FILTERS.find(f => f.id === filterRef.current)?.css ?? "none";
        ctx.drawImage(origImgRef.current, 0, 0, c.width, c.height);
        ctx.filter = "none";
        if (drawCvs.current) ctx.drawImage(drawCvs.current, 0, 0);
        ctx.restore();

        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth   = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
        [[x,y],[x+w,y],[x,y+h],[x+w,y+h],[x+w/2,y],[x+w/2,y+h],[x,y+h/2],[x+w,y+h/2]].forEach(([hx, hy]) => {
          ctx.fillStyle = "#60a5fa";
          ctx.fillRect(hx - 5, hy - 5, 10, 10);
        });
      }

    } else if (mode === "text" && isDragging.current && dragId.current) {
      // Text drag — x,y update karo, renderAll() immediately re-draw karega
      const updated = textsRef.current.map(t =>
        t.id === dragId.current
          ? { ...t, x: p.x - dragOffset.current.x, y: p.y - dragOffset.current.y }
          : t
      );
      textsRef.current = updated;
      setTexts(updated);
      renderAll(updated);
    }
  };


  const onUp = () => {
    isDrawing.current  = false;
    isDragging.current = false;
    dragId.current     = null;
    if (mode === "crop") {
      isCropping.current = false;
      if (cropRect.current?.w > 10 && cropRect.current?.h > 10) setHasCrop(true);
    }
  };


  // ── Apply Crop: selected area → naya origImg ──
  const applyCrop = () => {
    const { x, y, w, h } = cropRect.current;
    const c = canvasRef.current;
    renderAll();
    const data   = c.getContext("2d").getImageData(x, y, w, h);
    const tmp    = document.createElement("canvas");
    tmp.width    = Math.floor(w);
    tmp.height   = Math.floor(h);
    tmp.getContext("2d").putImageData(data, 0, 0);
    const newImg = new Image();
    newImg.onload = () => {
      origImgRef.current = newImg;
      drawCvs.current    = document.createElement("canvas");
      drawCvs.current.width  = Math.floor(w);
      drawCvs.current.height = Math.floor(h);
      c.width  = Math.floor(w);
      c.height = Math.floor(h);
      setFilter("normal"); filterRef.current = "normal";
      const kept = textsRef.current
        .filter(t => t.x >= x && t.x <= x+w && t.y >= y && t.y <= y+h)
        .map(t => ({ ...t, x: t.x - x, y: t.y - y }));
      textsRef.current = kept; setTexts(kept);
      cropRect.current = null; setHasCrop(false);
      renderAll(kept);
    };
    newImg.src = tmp.toDataURL();
  };

  const cancelCrop = () => { cropRect.current = null; setHasCrop(false); renderAll(); };


  // ── Add Text ──
  const addText = () => {
    if (!textInput.trim() || !pendingPos.current) return;
    const t = {
      id:      textIdCounter++,
      content: textInput,
      x:       pendingPos.current.x,
      y:       pendingPos.current.y,
      color:   textColor,
      size:    textSize,
    };
    const updated = [...textsRef.current, t];
    textsRef.current = updated;
    setTexts(updated);
    setSelectedId(t.id); selectedIdRef.current = t.id;
    renderAll(updated);
    setShowTextBox(false); setTextInput(""); pendingPos.current = null;
  };


  // ── Done: edited image dataURL → onDone prop function ──
  const handleDone = () => {
    setSelectedId(null); selectedIdRef.current = null;
    renderAll();
    const dataURL = canvasRef.current.toDataURL("image/png");
    onDone(dataURL); // ChatWindow ko bhejo
  };


  const switchMode = (m) => {
    if (mode === "crop") cancelCrop();
    setShowTextBox(false);
    setSelectedId(null); selectedIdRef.current = null;
    setMode(prev => prev === m ? null : m);
    renderAll();
  };


  return (
    // Fixed full-screen overlay — Tether ke dark theme ke saath match
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020818]">

      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-blue-900/30 bg-[#020818] px-4 py-3">
        <button
          onClick={onCancel}
          className="rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-900/30"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <span className="text-sm font-semibold tracking-widest text-blue-300/60 uppercase">
          Edit Photo
        </span>

        <button
          onClick={handleDone}
          className="rounded-full bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Done →
        </button>
      </div>

      {/* ── Canvas + Tools ── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden p-4">

        {/* Mode Buttons */}
        <div className="mb-3 flex gap-2 rounded-2xl border border-blue-900/30 bg-[#06234f]/60 px-4 py-2">
          {[
            { id: "crop", label: "✂️ Crop" },
            { id: "draw", label: "✏️ Draw" },
            { id: "text", label: "T  Text" },
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => switchMode(tool.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                mode === tool.id
                  ? "bg-blue-500 text-white shadow-[0_0_12px_rgba(96,165,250,0.35)]"
                  : "text-blue-300/60 hover:bg-blue-900/40 hover:text-blue-200"
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>

        {/* Draw / Text Options */}
        {(mode === "draw" || mode === "text") && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-blue-900/30 bg-[#06234f]/60 px-4 py-2">
            <span className="text-[11px] text-blue-400/50">
              {mode === "draw" ? "Brush" : "Font"}
            </span>
            <input
              type="range"
              min={mode === "draw" ? 2 : 14}
              max={mode === "draw" ? 24 : 72}
              value={mode === "draw" ? drawSize : textSize}
              onChange={e =>
                mode === "draw"
                  ? (setDrawSize(+e.target.value), drawSizeRef.current = +e.target.value)
                  : setTextSize(+e.target.value)
              }
              className="h-1 w-20 cursor-pointer accent-blue-500"
            />
            <span className="min-w-[22px] text-[11px] text-blue-300/50">
              {mode === "draw" ? drawSize : textSize}
            </span>
            <div className="mx-1 h-4 w-px bg-blue-900/50" />
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() =>
                  mode === "draw"
                    ? (setDrawColor(c), drawColorRef.current = c)
                    : setTextColor(c)
                }
                style={{ background: c }}
                className={`h-5 w-5 shrink-0 rounded-full transition-transform hover:scale-110 ${
                  (mode === "draw" ? drawColor : textColor) === c
                    ? "scale-110 ring-2 ring-blue-400 ring-offset-1 ring-offset-[#06234f]"
                    : ""
                }`}
              />
            ))}
          </div>
        )}

        {/* Canvas */}
        <div className="relative overflow-hidden rounded-xl shadow-[0_0_40px_rgba(37,99,235,0.15)]" style={{ lineHeight: 0 }}>
          <canvas
            ref={canvasRef}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
            style={{
              display: "block",
              maxWidth: "min(760px, calc(100vw - 48px))",
              maxHeight: "calc(100vh - 320px)",
              width: "100%",
              cursor: mode === "draw" || mode === "crop" || mode === "text"
                ? "crosshair" : "default",
            }}
          />

          {/* Crop confirm bar */}
          {mode === "crop" && hasCrop && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
              <button onClick={applyCrop}
                className="rounded-full bg-blue-500 px-5 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-blue-400">
                ✓ Apply Crop
              </button>
              <button onClick={cancelCrop}
                className="rounded-full border border-blue-900/40 bg-[#020818]/80 px-4 py-1.5 text-xs text-blue-300/50 hover:text-blue-300">
                Cancel
              </button>
            </div>
          )}

          {/* Text input popup */}
          {showTextBox && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="w-72 rounded-2xl border border-blue-900/40 bg-[#06234f] p-5 shadow-2xl">
                <p className="mb-3 text-xs text-blue-300/40">
                  Text likho · Enter = add · Esc = cancel
                </p>
                <input
                  autoFocus
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter")  addText();
                    if (e.key === "Escape") setShowTextBox(false);
                  }}
                  placeholder="Kuch likho..."
                  className="w-full rounded-xl border border-blue-900/40 bg-[#020818] px-4 py-2.5 text-sm text-white outline-none placeholder:text-blue-400/30 focus:border-blue-500/60"
                />
                <div className="mt-3 flex gap-2">
                  <button onClick={addText}
                    className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                    Add Text
                  </button>
                  <button onClick={() => setShowTextBox(false)}
                    className="flex-1 rounded-xl border border-blue-900/40 py-2 text-sm text-blue-300/50 hover:text-blue-300">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mode hint */}
        {mode && !showTextBox && (
          <p className="mt-2 text-center text-[11px] text-blue-400/35">
            {mode === "crop" && "Drag karo crop area select karne ke liye"}
            {mode === "draw" && "Click + drag karke draw karo"}
            {mode === "text" && "Khali jagah = naya text  ·  Text pe click = drag karo"}
          </p>
        )}
      </div>

      {/* ── Filter Strip ── */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-t border-blue-900/30 bg-[#020818] px-4 py-3">
        <span className="shrink-0 text-[11px] text-blue-400/35">Filter:</span>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-4 py-1 text-xs font-medium transition-all ${
              filter === f.id
                ? "bg-blue-500/90 text-white shadow-[0_0_10px_rgba(96,165,250,0.25)]"
                : "border border-blue-900/30 text-blue-300/40 hover:border-blue-600/40 hover:text-blue-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageEditor;