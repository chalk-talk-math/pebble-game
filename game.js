let nodes = [];
let pebbleBank = 0;
let treeDepth = 3;
let holdTriggered = false;

let undoStack = [];

const treeContainer = document.getElementById("tree");
const edgeSvg = document.getElementById("edges");
const pebbleBankDisplay = document.getElementById("pebbleBankDisplay");

function startGame() {
  const depthInput = document.getElementById("levelInput");
  const pebbleInput = document.getElementById("pebbleInput");

  treeDepth = Math.min(5, Math.max(2, parseInt(depthInput.value)));
  pebbleBank = Math.min(32, Math.max(1, parseInt(pebbleInput.value)));

  const numNodes = Math.pow(2, treeDepth) - 1;
  nodes = Array(numNodes).fill(null).map((_, i) => ({
    id: i,
    hasPebble: false,
    element: null,
    x: 0,
    y: 0,
  }));

  renderTree(treeDepth);
  updatePebbleBank();
}

function renderTree(depth) {
  treeContainer.innerHTML = "";
  edgeSvg.innerHTML = "";

  let nodeIndex = 0;
  const totalNodes = nodes.length;
  const leafStartIndex = totalNodes - Math.pow(2, depth - 1);
  const levelSpacing = 100;

  for (let level = 0; level < depth; level++) {
    const levelDiv = document.createElement("div");
    levelDiv.className = "level";

    const numNodesAtLevel = Math.pow(2, level);
    for (let i = 0; i < numNodesAtLevel; i++) {
      const node = nodes[nodeIndex];
      const isLeaf = nodeIndex >= leafStartIndex;

      const el = document.createElement("div");
      el.className = "node";
      node.element = el;

      let holdTimeout = null;


      // Mouse and touch start
      el.addEventListener('mousedown', (e) => {
        holdTriggered = false;
        holdTimeout = setTimeout(() => {
          tryMovePebbleUp(node.id);
          holdTriggered = true;
        }, 500); // Hold for 500ms to trigger move
      });

      el.addEventListener('touchstart', (e) => {
        holdTriggered = false;
        holdTimeout = setTimeout(() => {
          tryMovePebbleUp(node.id);
          holdTriggered = true;
        }, 500);
      });

      // Mouse and touch end
      el.addEventListener('mouseup', (e) => {
        clearTimeout(holdTimeout);
        if (!holdTriggered) {
          if (isLeaf) {
            togglePebble(node.id);
          }
        }
      });

      el.addEventListener('mouseleave', (e) => {
        clearTimeout(holdTimeout);
      });

      el.addEventListener('touchend', (e) => {
        clearTimeout(holdTimeout);
        if (!holdTriggered) {
          if (isLeaf) {
            togglePebble(node.id);
          }
        }
      });

      if (node.hasPebble) el.classList.add("pebbled");

      levelDiv.appendChild(el);
      nodeIndex++;
    }

    treeContainer.appendChild(levelDiv);
  }

  setTimeout(drawEdges, 50); // wait for DOM to settle

  const successMessage = document.getElementById("successMessage");
  if (nodes[0]?.hasPebble) {
    successMessage.style.display = "block";
  } else {
    successMessage.style.display = "none";
  }
}

function drawEdges() {
  edgeSvg.innerHTML = "";
  const depth = treeDepth;

  for (let parent = 0; parent < nodes.length; parent++) {
    const leftChild = 2 * parent + 1;
    const rightChild = 2 * parent + 2;

    if (nodes[leftChild]) drawLine(nodes[parent].element, nodes[leftChild].element);
    if (nodes[rightChild]) drawLine(nodes[parent].element, nodes[rightChild].element);
  }
}

function drawLine(fromEl, toEl) {
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();

  const svgRect = edgeSvg.getBoundingClientRect();

  const x1 = fromRect.left + fromRect.width / 2 - svgRect.left;
  const y1 = fromRect.top + fromRect.height / 2 - svgRect.top;
  const x2 = toRect.left + toRect.width / 2 - svgRect.left;
  const y2 = toRect.top + toRect.height / 2 - svgRect.top;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", "black");
  line.setAttribute("stroke-width", "2");
  edgeSvg.appendChild(line);
}

function togglePebble(id) {
  const node = nodes[id];
  if (!node.hasPebble && pebbleBank <= 0) {
    alert("No pebbles left in the bank!");
    return;
  }

  const prev = { id, wasPebbled: node.hasPebble, type: "toggle" };
  undoStack.push(prev);

  node.hasPebble = !node.hasPebble;
  if (node.hasPebble) pebbleBank--;
  else pebbleBank++;

  updatePebbleBank();
  renderTree(treeDepth);
}

function updatePebbleBank() {
  const countText = document.getElementById("pebbleCountText");
  const iconsBox = document.getElementById("pebbleIcons");

  countText.textContent = `Pebbles: ${pebbleBank}`;
  iconsBox.innerHTML = "";

  for (let i = 0; i < pebbleBank; i++) {
    const pebble = document.createElement("div");
    pebble.className = "pebble";
    iconsBox.appendChild(pebble);
  }
}


function tryMovePebbleUp(childId) {
  const parent = Math.floor((childId - 1) / 2);
  if (parent < 0) return;

  const leftChild = 2 * parent + 1;
  const rightChild = 2 * parent + 2;

  const leftPebble = nodes[leftChild]?.hasPebble;
  const rightPebble = nodes[rightChild]?.hasPebble;

  if (nodes[parent].hasPebble) {
    alert("Invalid move: Parent already has a pebble.");
    return;
  }

  if (!leftPebble || !rightPebble) {
    alert("Invalid move: Both children must have pebbles to move a pebble up.");
    return;
  }

  // Move up (clicked child loses pebble, parent gains pebble)
  const move = {
    type: "moveUpOne",
    from: childId,
    to: parent
  };

  undoStack.push(move);

  nodes[childId].hasPebble = false;
  nodes[parent].hasPebble = true;

  updatePebbleBank();
  renderTree(treeDepth);
}


function undoAction() {
  const last = undoStack.pop();
  if (!last) return;

  if (last.type === "moveUpOne") {
  nodes[last.from].hasPebble = true;
  nodes[last.to].hasPebble = false;
}

  if (last.type === "toggle") {
    nodes[last.id].hasPebble = last.wasPebbled;
    pebbleBank += last.wasPebbled ? -1 : 1;
  }

  if (last.type === "moveUp") {
    nodes[last.from].hasPebble = true;
    nodes[last.to].hasPebble = false;
    if (!last.siblingHadPebble) {
      nodes[last.sibling].hasPebble = false;
    }
  }

  updatePebbleBank();
  renderTree(treeDepth);
}

function animatePebbleMove(fromEl, toEl, callback) {
  const pebble = fromEl.cloneNode(true);
  document.body.appendChild(pebble);

  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();

  pebble.style.position = "absolute";
  pebble.style.zIndex = 1000;
  pebble.style.left = fromRect.left + "px";
  pebble.style.top = fromRect.top + "px";
  pebble.style.width = fromRect.width + "px";
  pebble.style.height = fromRect.height + "px";
  pebble.style.transition = "all 0.4s ease-in-out";
  pebble.style.background = "#EACE6A";
  pebble.style.borderRadius = "50%";

  requestAnimationFrame(() => {
    pebble.style.left = toRect.left + "px";
    pebble.style.top = toRect.top + "px";
  });

  setTimeout(() => {
    document.body.removeChild(pebble);
    callback();
  }, 400);
}
