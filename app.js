// =========================
// SCALE / NOTE LOGIC (JS)
// =========================

const CHROMATIC_SCALE = ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"];

const NOTE_NUMBER = {
  "A": 1, "Bb": 2, "B": 3, "C": 4, "Db": 5, "D": 6,
  "Eb": 7, "E": 8, "F": 9, "Gb": 10, "G": 11, "Ab": 12
};

// Standard guitar tuning (low to high)
const STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"];

// Intervals copied from your MATLAB logic
const INTERVALS = {
  "minor": [0, 2, 3, 5, 7, 8, 10],
  "major": [0, 2, 4, 5, 7, 9, 11],
  "melodic minor": [0, 2, 3, 5, 7, 9, 11],
  "harmonic minor": [0, 2, 3, 5, 7, 8, 10],
  "blues minor pentatonic": [0, 3, 5, 6, 7, 10],
};

const DISPLAY_NAMES = [
  "Major",
  "Minor",
  "Melodic Minor",
  "Harmonic Minor",
  "Blues Minor Pentatonic",
];

function normalize(s){
  return String(s).trim().toLowerCase();
}

function buildScale(root, intervals){
  const rootIdx1 = NOTE_NUMBER[root]; // 1..12
  const out = [];
  for (const step of intervals){
    const idx1 = ((rootIdx1 - 1 + step) % 12) + 1; // 1..12
    out.push(CHROMATIC_SCALE[idx1 - 1]);
  }
  return out;
}

function scaleFind(root, whichScale){
  root = String(root).trim();
  if (!(root in NOTE_NUMBER)){
    throw new Error(`"${root}" is not valid. Valid roots: ${CHROMATIC_SCALE.join(", ")}`);
  }
  const key = normalize(whichScale);
  if (!(key in INTERVALS)){
    throw new Error(`"${whichScale}" is not valid.`);
  }
  return buildScale(root, INTERVALS[key]);
}

function noteAtFret(openNote, fret){
  const openIdx1 = NOTE_NUMBER[openNote];
  const idx1 = ((openIdx1 - 1 + fret) % 12) + 1;
  return CHROMATIC_SCALE[idx1 - 1];
}

function getFretPositions(scaleNotes, maxFret=12){
  const scaleSet = new Set(scaleNotes);
  const positions = {};
  for (const openNote of STANDARD_TUNING){
    const hits = [];
    for (let fret=0; fret<=maxFret; fret++){
      if (scaleSet.has(noteAtFret(openNote, fret))){
        hits.push(fret);
      }
    }
    positions[openNote] = hits;
  }
  return positions;
}

// =========================
// SVG FRETBOARD DRAWING
// =========================

function cssVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function makeSvgEl(tag){
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function drawFretboardSVG({ positions, maxFret, rootNote, scaleName, blueNote }){
  // Canvas geometry in SVG coordinates
  const W = 860;
  const H = 360;

  const left = 90;
  const right = W - 20;
  const top = 35;
  const bottom = H - 55;

  const numStrings = 6;
  const stringGap = (bottom - top) / (numStrings - 1);

  // +1 gives fret 0 its own column like your Tkinter version
  const fretGap = (right - left) / (maxFret + 1);

  // Display like tab: high -> low
  const tuningHighToLow = [...STANDARD_TUNING].reverse();

  const svg = makeSvgEl("svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Fretboard frets 0 to ${maxFret}`);

  // Background rect
  const bg = makeSvgEl("rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", String(W));
  bg.setAttribute("height", String(H));
  bg.setAttribute("rx", "10");
  bg.setAttribute("fill", cssVar("--board-bg"));
  svg.appendChild(bg);

  // Title
  const title = makeSvgEl("text");
  title.setAttribute("x", String((left + right) / 2));
  title.setAttribute("y", "18");
  title.setAttribute("text-anchor", "middle");
  title.setAttribute("font-size", "14");
  title.setAttribute("font-weight", "700");
  title.setAttribute("fill", cssVar("--label"));
  title.textContent = `Frets 0–${maxFret}`;
  svg.appendChild(title);

  // Strings + labels
  for (let s=0; s<numStrings; s++){
    const y = top + s * stringGap;

    const line = makeSvgEl("line");
    line.setAttribute("x1", String(left));
    line.setAttribute("y1", String(y));
    line.setAttribute("x2", String(right));
    line.setAttribute("y2", String(y));
    line.setAttribute("stroke", cssVar("--string"));
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);

    const label = makeSvgEl("text");
    label.setAttribute("x", "35");
    label.setAttribute("y", String(y + 5));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "14");
    label.setAttribute("font-weight", "700");
    label.setAttribute("fill", cssVar("--label"));
    label.textContent = tuningHighToLow[s];
    svg.appendChild(label);
  }

  // Nut (fret 0)
  const nut = makeSvgEl("line");
  nut.setAttribute("x1", String(left));
  nut.setAttribute("y1", String(top - 12));
  nut.setAttribute("x2", String(left));
  nut.setAttribute("y2", String(bottom + 12));
  nut.setAttribute("stroke", cssVar("--fret"));
  nut.setAttribute("stroke-width", "6");
  svg.appendChild(nut);

  // Fret numbers + lines
  const zeroTxt = makeSvgEl("text");
  zeroTxt.setAttribute("x", String(left));
  zeroTxt.setAttribute("y", String(bottom + 30));
  zeroTxt.setAttribute("text-anchor", "middle");
  zeroTxt.setAttribute("font-size", "12");
  zeroTxt.setAttribute("fill", cssVar("--label"));
  zeroTxt.textContent = "0";
  svg.appendChild(zeroTxt);

  for (let f=1; f<=maxFret; f++){
    const x = left + f * fretGap;

    const fret = makeSvgEl("line");
    fret.setAttribute("x1", String(x));
    fret.setAttribute("y1", String(top - 12));
    fret.setAttribute("x2", String(x));
    fret.setAttribute("y2", String(bottom + 12));
    fret.setAttribute("stroke", cssVar("--fret"));
    fret.setAttribute("stroke-width", "2");
    svg.appendChild(fret);

    const txt = makeSvgEl("text");
    txt.setAttribute("x", String(x));
    txt.setAttribute("y", String(bottom + 30));
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("font-size", "12");
    txt.setAttribute("fill", cssVar("--label"));
    txt.textContent = String(f);
    svg.appendChild(txt);
  }

  // Markers
  const r = 14;
  for (let s=0; s<numStrings; s++){
    const openNote = tuningHighToLow[s];
    const y = top + s * stringGap;

    const frets = positions[openNote] || [];
    for (const f of frets){
      const x = left + f * fretGap;
      const noteHere = noteAtFret(openNote, f);

      const isRoot = noteHere === rootNote;
      const isBlue = (blueNote && noteHere === blueNote);

      // Root wins over blue if ever same (safe)
      let fill = cssVar("--marker");
      if (isRoot) fill = cssVar("--root");
      else if (isBlue) fill = cssVar("--blue");

      const circ = makeSvgEl("circle");
      circ.setAttribute("cx", String(x));
      circ.setAttribute("cy", String(y));
      circ.setAttribute("r", String(r));
      circ.setAttribute("fill", fill);
      circ.setAttribute("stroke", cssVar("--marker-stroke"));
      circ.setAttribute("stroke-width", "2");
      svg.appendChild(circ);

      const t = makeSvgEl("text");
      t.setAttribute("x", String(x));
      t.setAttribute("y", String(y + 4));
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-size", "12");
      t.setAttribute("font-weight", "800");
      t.setAttribute("fill", cssVar("--label"));
      t.textContent = String(f);
      svg.appendChild(t);
    }
  }

  return svg;
}

// =========================
// UI WIRING
// =========================

const rootSelect = document.getElementById("rootSelect");
const scaleSelect = document.getElementById("scaleSelect");
const maxFretSelect = document.getElementById("maxFretSelect");
const showBtn = document.getElementById("showBtn");
const notesLine = document.getElementById("notesLine");
const svgHost = document.getElementById("svgHost");

function fillSelect(select, items, defaultValue){
  select.innerHTML = "";
  for (const it of items){
    const opt = document.createElement("option");
    opt.value = it;
    opt.textContent = it;
    select.appendChild(opt);
  }
  select.value = defaultValue;
}

function render(){
  const rootNote = rootSelect.value;
  const scaleName = scaleSelect.value;
  const maxFret = Number(maxFretSelect.value);

  // compute blue note only for blues minor pentatonic (interval 6)
  let blueNote = null;
  if (normalize(scaleName) === "blues minor pentatonic"){
    blueNote = buildScale(rootNote, [6])[0];
  }

  try{
    const notes = scaleFind(rootNote, scaleName);
    notesLine.textContent = `${rootNote} ${scaleName}: ${notes.join(", ")}`;

    const positions = getFretPositions(notes, maxFret);

    const svg = drawFretboardSVG({ positions, maxFret, rootNote, scaleName, blueNote });
    svgHost.innerHTML = "";
    svgHost.appendChild(svg);
  }catch(err){
    notesLine.textContent = String(err.message || err);
    svgHost.innerHTML = "";
  }
}

// init selects
fillSelect(rootSelect, CHROMATIC_SCALE, "C");
fillSelect(scaleSelect, DISPLAY_NAMES, "Major");
fillSelect(maxFretSelect, [12, 15, 17, 19, 21, 22, 24].map(String), "12");

showBtn.addEventListener("click", render);

// auto-render once
render();