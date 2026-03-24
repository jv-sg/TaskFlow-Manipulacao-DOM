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

columns.forEach((column) => {
    column.addEventListener("dragover", dragsOver)
    column.addEventListener("dragenter", dragsEnter)
    column.addEventListener("dragleave", dragsLeave)
})

cards.forEach((card) => {
    card.addEventListener("dragstart", dragStart)
})