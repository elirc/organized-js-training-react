//handles user custom question editing
function openEditor(data) {
const modal = document.getElementById("editor-modal");
const container = document.getElementById("editor-container");


container.innerHTML = "";


data.forEach((cat, cIndex) => {
const section = document.createElement("div");
section.innerHTML = `<h3>${cat.category}</h3>`;


cat.questions.forEach((qa, qIndex) => {
const qInput = document.createElement("textarea");
qInput.value = qa.q;


const aInput = document.createElement("textarea");
aInput.value = qa.a;


section.appendChild(qInput);
section.appendChild(aInput);
});


container.appendChild(section);
});


modal.classList.remove("hidden");
}


function saveEditorChanges(data) {
const container = document.getElementById("editor-container");
const sections = [...container.children];


sections.forEach((sec, cIndex) => {
const inputs = [...sec.querySelectorAll("textarea")];
const pairs = [];


for (let i = 0; i < inputs.length; i += 2) {
pairs.push({ q: inputs[i].value, a: inputs[i + 1].value });
}


data[cIndex].questions = pairs;
});


localStorage.setItem("customJeopardy", JSON.stringify(data));
}