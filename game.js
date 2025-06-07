let nodes = [];
let pebbleBank = 0;
let treeDepth = 3;
let holdTriggered = false;
let holdTimeout = null;
leafStartIndex = 0;


let undoStack = [];

const treeContainer = document.getElementById("tree");
const edgeSvg = document.getElementById("edges");
const pebbleBankDisplay = document.getElementById("pebbleBankDisplay");

/**
 * Initializes and starts the pebble game by setting up the tree structure
 * and pebble bank based on user input. The function ensures that the tree
 * depth and pebble count are within predefined limits, creates the nodes
 * for the tree, and renders the tree on the screen.
 *
 * @function
 * @global
 * @throws {TypeError} Throws an error if the input values cannot be parsed as integers.
 */
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

/**
 * Renders a binary tree structure in the DOM based on the given depth and node data.
 * Clears the existing tree and edge elements, then dynamically creates and appends
 * nodes and levels to the tree container. Adds event listeners for interaction with
 * the nodes and updates the success message visibility based on the root node's state.
 *
 * @param {number} depth - The depth of the tree to render. Determines the number of levels.
 */
function renderTree(depth) {
  treeContainer.innerHTML = "";
  edgeSvg.innerHTML = "";

  let nodeIndex = 0;
  const totalNodes = nodes.length;
  leafStartIndex = totalNodes - Math.pow(2, depth - 1);
  const levelSpacing = 100;

  for (let level = 0; level < depth; level++) {
    const levelDiv = document.createElement("div");
    levelDiv.className = "level";

    const numNodesAtLevel = Math.pow(2, level);
    for (let i = 0; i < numNodesAtLevel; i++) {
      let node = nodes[nodeIndex];


      const el = document.createElement("div");
      el.className = "node";
      node.element = el;

      // Mouse and touch start
      el.addEventListener('pointerdown', (e) => {
        select(node.id);
      });

      // Mouse and touch end
      el.addEventListener('pointerup', (e) => {
        release(node.id);
      });

      //Mouse leave event (no touch equivalent)
      el.addEventListener('mouseleave', (e) => {
        clearTimeout(holdTimeout);
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


/**
 * Handles the release action for a node in the pebble game.
 * If the node has a pebble, it clears the pebble. If the node is a leaf and does not have a pebble, it adds a pebble.
 * The function also clears any active timeout and ensures the action is only performed if the hold was not triggered.
 *
 * @param {number} nodeIndex - The index of the node to release.
 */
function release(nodeIndex) {
  const node = nodes[nodeIndex];
  const isLeaf = nodeIndex >= leafStartIndex;
  clearTimeout(holdTimeout);
  if (!holdTriggered) {
    if (node.hasPebble) {
      clearPebble(node.id);
    }
    else if (isLeaf) {
      addPebble(node.id);
    }
  }
}


/**
 * Handles the selection of a node in the game. If the selected node is a leaf node,
 * it sets up a timeout to trigger a "hold" action after 500 milliseconds, which attempts
 * to move a pebble up from the selected node.
 *
 * @param {number} nodeIndex - The index of the node being selected.
 */
function select(nodeIndex) {
  const node = nodes[nodeIndex];
  const isLeaf = nodeIndex >= leafStartIndex;
  holdTriggered = false;
  holdTimeout = setTimeout(() => {
    tryMovePebbleUp(node.id);
    holdTriggered = true;
  }, 500);
}

/**
 * Draws edges between parent and child nodes in a binary tree structure.
 * Clears the existing edges from the SVG container and iterates through
 * the nodes to draw lines connecting each parent node to its left and
 * right child nodes, if they exist.
 *
 * Assumes the following:
 * - `edgeSvg` is a global variable representing the SVG container for edges.
 * - `treeDepth` is a global variable representing the depth of the tree.
 * - `nodes` is a global array where each element contains a `element` property
 *   representing the DOM element of the node.
 * - `drawLine` is a function that takes two DOM elements and draws a line
 *   between them.
 */
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

/**
 * Draws a line between two HTML elements on an SVG canvas.
 *
 * @param {HTMLElement} fromEl - The starting HTML element for the line.
 * @param {HTMLElement} toEl - The ending HTML element for the line.
 */
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

/**
 * Clears a pebble from the specified node by its ID. If the node has a pebble,
 * it updates the node's state, increments the pebble bank, and records the action
 * in the undo stack for potential reversal. Finally, it updates the pebble bank
 * display and re-renders the tree.
 *
 * @param {number} id - The ID of the node from which the pebble will be cleared.
 */
function clearPebble(id) {
  const node = nodes[id];
  if (node.hasPebble) {
    const prev = { id, wasPebbled: node.hasPebble, type: "toggle" };
    undoStack.push(prev);

    node.hasPebble = false;
    pebbleBank++;
  }
  updatePebbleBank();
  renderTree(treeDepth);
}

/**
 * Adds a pebble to a node identified by its ID. If the node does not already
 * have a pebble and there are pebbles available in the bank, it updates the
 * node's state, decrements the pebble bank, and updates the tree rendering.
 * If no pebbles are left in the bank, an alert is shown.
 *
 * @param {number} id - The unique identifier of the node to which a pebble is added.
 */
function addPebble(id) {
  const node = nodes[id];
  if (!node.hasPebble && pebbleBank <= 0) {
    alert("No pebbles left in the bank!");
    return;
  }

  if (!node.hasPebble) {
    const prev = { id, wasPebbled: node.hasPebble, type: "toggle" };
    undoStack.push(prev);

    node.hasPebble = true;
    pebbleBank--;
  }
  updatePebbleBank();
  renderTree(treeDepth);
}


/**
 * Updates the pebble bank display on the webpage.
 * 
 * This function updates the text content of an element with the ID "pebbleCountText"
 * to show the current number of pebbles in the pebble bank. It also clears and repopulates
 * the element with the ID "pebbleIcons" with a number of pebble icons corresponding to
 * the current pebble count.
 * 
 * Assumes the existence of a global variable `pebbleBank` representing the current
 * number of pebbles.
 * 
 * Dependencies:
 * - An element with the ID "pebbleCountText" must exist in the DOM.
 * - An element with the ID "pebbleIcons" must exist in the DOM.
 * - A CSS class "pebble" must be defined for the pebble icons.
 */
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


/**
 * Attempts to move a pebble from a child node to its parent node in a binary tree structure.
 * 
 * The move is only valid if:
 * - The parent node does not already have a pebble.
 * - Both child nodes of the parent have pebbles.
 * 
 * If the move is valid, the pebble is moved from the child node to the parent node,
 * and the move is recorded in the undo stack. The pebble bank and tree rendering
 * are updated accordingly.
 * 
 * @param {number} childId - The ID of the child node attempting to move its pebble up.
 * @returns {void} - Does not return a value.
 */
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


/**
 * Reverts the last action performed in the game by popping it from the undo stack
 * and restoring the previous state of the nodes and pebble bank.
 * 
 * The function handles three types of actions:
 * - "moveUpOne": Moves a pebble back from one node to another.
 * - "toggle": Restores the pebble state of a node and adjusts the pebble bank.
 * - "moveUp": Moves a pebble back from one node to another and optionally restores
 *   the state of a sibling node if it was affected.
 * 
 * After reverting the action, the function updates the pebble bank and re-renders
 * the tree to reflect the changes.
 */
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

/**
 * Note: I don't think is used anywhere in the code, but it was in the original code. --Bronzite, 2025-05-02
 * 
 * Animates the movement of a pebble element from one DOM element to another.
 * A temporary clone of the pebble is created and animated to simulate the movement.
 * The original pebble remains in place, and the temporary clone is removed after the animation.
 *
 * @param {HTMLElement} fromEl - The DOM element representing the starting position of the pebble.
 * @param {HTMLElement} toEl - The DOM element representing the target position of the pebble.
 * @param {Function} callback - A callback function to be executed after the animation completes.
 */
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
