let nodes = [];
const treeContainer = document.getElementById("tree");

function startGame() {
  const levelInput = document.getElementById("levelInput");
  const depth = Math.min(10, Math.max(2, parseInt(levelInput.value)));

  // Number of nodes in a complete binary tree of depth d = 2^d - 1
  const numNodes = Math.pow(2, depth) - 1;

  nodes = Array(numNodes).fill(null).map((_, i) => ({
    id: i,
    hasPebble: false,
    element: null
  }));

  renderTree(depth);
}

function createNodeEl(node) {
  const el = document.createElement("div");
  el.className = "node";
  el.textContent = node.id;
  el.onclick = (e) => {
    if (e.shiftKey) {
      tryMovePebbleUp(node.id);
    } else {
      togglePebble(node.id);
    }
  };
  return el;
}

function renderTree(depth) {
  treeContainer.innerHTML = "";

  let nodeIndex = 0;

  for (let level = 0; level < depth; level++) {
    const levelDiv = document.createElement("div");
    levelDiv.className = "level";
    const numNodesAtLevel = Math.pow(2, level);

    for (let i = 0; i < numNodesAtLevel; i++) {
      const node = nodes[nodeIndex];
      const el = createNodeEl(node);
      node.element = el;
      if (node.hasPebble) el.classList.add("pebbled");
      levelDiv.appendChild(el);
      nodeIndex++;
    }

    treeContainer.appendChild(levelDiv);
  }
}

function togglePebble(id) {
  nodes[id].hasPebble = !nodes[id].hasPebble;
  renderTree(getCurrentDepth());
}

function tryMovePebbleUp(id) {
  const parent = Math.floor((id - 1) / 2);
  if (parent < 0) return;

  const leftChild = 2 * parent + 1;
  const rightChild = 2 * parent + 2;

  if (
    nodes[leftChild] &&
    nodes[rightChild] &&
    nodes[leftChild].hasPebble &&
    nodes[rightChild].hasPebble &&
    !nodes[parent].hasPebble
  ) {
    nodes[leftChild].hasPebble = false;
    nodes[rightChild].hasPebble = false;
    nodes[parent].hasPebble = true;
    renderTree(getCurrentDepth());
  } else {
    alert("To move a pebble up, both children must have pebbles and the parent must be empty.");
  }
}

function getCurrentDepth() {
  return Math.log2(nodes.length + 1);
}