function loadData() {
const saved = localStorage.getItem("customJeopardy");
return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultData));
}


let gameData = loadData();


// Initialize
renderCategories(gameData);
renderBoard(gameData);


// Answer modal
const answerModal = document.getElementById("answer-modal");
const closeAnswer = document.getElementById("close-answer");
closeAnswer.addEventListener("click", () => answerModal.classList.add("hidden"));


// Editor
const editBtn = document.getElementById("edit-btn");
const editorModal = document.getElementById("editor-modal");
const closeEditorBtn = document.getElementById("close-editor");
const saveBtn = document.getElementById("save-questions");


editBtn.addEventListener("click", () => openEditor(gameData));
closeEditorBtn.addEventListener("click", () => editorModal.classList.add("hidden"));
saveBtn.addEventListener("click", () => {
saveEditorChanges(gameData);
editorModal.classList.add("hidden");
renderCategories(gameData);
renderBoard(gameData);
});