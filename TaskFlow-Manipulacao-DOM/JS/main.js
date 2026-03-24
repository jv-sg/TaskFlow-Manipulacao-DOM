const columns = document.querySelectorAll(".column__cards");
const cards = document.querySelectorAll(".card");

let draggedCard;

const dragStart = (event) => {
    draggedCard = event.target;
    event.dataTransfer.effectAllowed = "move"
}

const dragsOver = (event) => {
    event.preventDefault()
}

const dragsEnter = ({ target }) => {
    if (target.classList.contains("column__cards")){
        target.classList.add("column--highlight")
    }
}

const dragsLeave = ({ target }) => {
    target.classList.remove("column--highlight")
}

const drop = ({ target }) => {
    if (target.classList.contains("column__cards")){
    target.classList.remove("column--highlight")
    target.append(draggedCard)
    }
}

const createCard = (event) => {
    const target = event.target;
    if (target.classList.contains("card")) {
        target.contentEditable = "true";
        target.focus();
        return;
    }

    if (target.classList.contains("column__cards")){
        const card = document.createElement("section")
        card.className = "card"
        card.draggable = "true"
        card.contentEditable = "true"
        card.addEventListener("focusout", () => {
            card.contentEditable = "false"
            if (!card.textContent) card.remove()
        })
        card.addEventListener("dragstart", dragStart)
        target.append(card)
        card.focus()
    }
}

columns.forEach((column) => {
    column.addEventListener("dragover", dragsOver)
    column.addEventListener("dragenter", dragsEnter)
    column.addEventListener("dragleave", dragsLeave)
    column.addEventListener("drop", drop)
    column.addEventListener("dblclick", createCard)
})

cards.forEach((card) => {
    card.addEventListener("dragstart", dragStart)
})