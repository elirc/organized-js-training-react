// renders grid + handles tile flipping
function renderCategories(data) {
const catContainer = document.getElementById("categories");
catContainer.innerHTML = "";


data.forEach(c => {
const div = document.createElement("div");
div.textContent = c.category;
catContainer.appendChild(div);
});
}


function renderBoard(data) {
const board = document.getElementById("board");
board.innerHTML = "";


data.forEach((cat, cIndex) => {
cat.questions.forEach((qa, qIndex) => {
const tile = document.createElement("div");
tile.className = "tile";
tile.textContent = qa.q;


tile.addEventListener("click", () => showAnswer(qa, tile));
board.appendChild(tile);
});
});
}


function showAnswer(qa, tile) {
tile.classList.add("clicked");


const modal = document.getElementById("answer-modal");
const text = document.getElementById("answer-text");


text.textContent = qa.a;
modal.classList.remove("hidden");
}