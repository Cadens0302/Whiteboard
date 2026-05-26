const laneOrder = ["ideas", "today", "next", "done"];
const taskForm = document.querySelector("#task-form");
const taskTemplate = document.querySelector("#task-template");
const board = document.querySelector(".board-grid");
const scrollButtons = document.querySelectorAll("[data-scroll-target]");
const canvas = document.querySelector("#whiteboard-canvas");
const colorInput = document.querySelector("#brush-color");
const sizeInput = document.querySelector("#brush-size");
const clearCanvasButton = document.querySelector("#clear-canvas");

const context = canvas.getContext("2d");
let isDrawing = false;
let lastPoint = null;
let hasUserDrawing = false;

scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.scrollTarget);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const titleField = taskForm.elements.taskTitle;
  const laneField = taskForm.elements.taskLane;
  const taskTitle = titleField.value.trim();

  if (!taskTitle) {
    titleField.focus();
    return;
  }

  const taskNode = taskTemplate.content.firstElementChild.cloneNode(true);
  taskNode.dataset.taskId = `task-${Date.now()}`;
  taskNode.querySelector("h4").textContent = taskTitle;

  if (hasUserDrawing) {
    attachCanvasToTask(taskNode);
    resetCanvas();
  }

  const laneList = document.getElementById(`${laneField.value}-list`);
  laneList.prepend(taskNode);
  syncCompletedStyle(taskNode, laneField.value);

  titleField.value = "";
  laneField.value = "ideas";
  titleField.focus();
});

board.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".task-delete");
  if (deleteButton) {
    deleteButton.closest(".task-card").remove();
    return;
  }

  const button = event.target.closest(".task-action");
  if (!button) {
    return;
  }

  const taskCard = button.closest(".task-card");
  const currentLane = button.closest(".lane").dataset.lane;
  const nextLane = laneOrder[(laneOrder.indexOf(currentLane) + 1) % laneOrder.length];
  const targetList = document.getElementById(`${nextLane}-list`);

  targetList.prepend(taskCard);
  syncCompletedStyle(taskCard, nextLane);
});

function syncCompletedStyle(taskCard, laneName) {
  const meta = taskCard.querySelector(".task-meta");
  const footerNote = taskCard.querySelector(".task-footer span");

  if (laneName === "done") {
    taskCard.classList.add("is-complete");
    meta.textContent = "Completed";
    footerNote.textContent = "Wrapped up";
    return;
  }

  taskCard.classList.remove("is-complete");

  if (laneName === "today") {
    meta.textContent = "In Focus";
    footerNote.textContent = "Working session";
    return;
  }

  if (laneName === "next") {
    meta.textContent = "Queued";
    footerNote.textContent = "Ready soon";
    return;
  }

  meta.textContent = "New Task";
  footerNote.textContent = "Added just now";
}

initializeCanvas();

function initializeCanvas() {
  context.lineCap = "round";
  context.lineJoin = "round";

  fitCanvasToContainer();

  window.addEventListener("resize", fitCanvasToContainer);
  clearCanvasButton.addEventListener("click", resetCanvas);

  canvas.addEventListener("pointerdown", startDrawing);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointerleave", stopDrawing);
}

function fitCanvasToContainer() {
  const frame = canvas.parentElement;
  const rect = frame.getBoundingClientRect();
  const nextWidth = Math.max(320, Math.floor(rect.width));
  const nextHeight = Math.max(280, Math.floor(nextWidth * 0.44));

  const snapshot = context.getImageData(0, 0, canvas.width, canvas.height);

  canvas.width = nextWidth;
  canvas.height = nextHeight;
  context.putImageData(snapshot, 0, 0);

  if (!hasUserDrawing) {
    drawCanvasGuideText();
  }
}

function startDrawing(event) {
  if (!hasUserDrawing) {
    clearCanvasSurface();
  }

  isDrawing = true;
  lastPoint = getCanvasPoint(event);
}

function draw(event) {
  if (!isDrawing) {
    return;
  }

  const currentPoint = getCanvasPoint(event);
  hasUserDrawing = true;
  context.strokeStyle = colorInput.value;
  context.lineWidth = Number(sizeInput.value);
  context.beginPath();
  context.moveTo(lastPoint.x, lastPoint.y);
  context.lineTo(currentPoint.x, currentPoint.y);
  context.stroke();
  lastPoint = currentPoint;
}

function stopDrawing() {
  isDrawing = false;
  lastPoint = null;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function resetCanvas() {
  hasUserDrawing = false;
  clearCanvasSurface();
  drawCanvasGuideText();
}

function clearCanvasSurface() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function drawCanvasGuideText() {
  context.fillStyle = "rgba(95, 104, 94, 0.95)";
  context.font = '600 18px "Manrope", sans-serif';
  context.fillText("Sketch flow ideas, client notes, or quick diagrams here.", 26, 38);
}

function attachCanvasToTask(taskCard) {
  const sketchWrap = taskCard.querySelector(".task-sketch");
  const sketchImage = taskCard.querySelector(".task-sketch-image");

  sketchImage.src = canvas.toDataURL("image/png");
  sketchWrap.hidden = false;
}
