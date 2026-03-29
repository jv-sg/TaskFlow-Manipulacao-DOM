const columns = document.querySelectorAll(".column__cards");
let draggedCard = null;
let touchTimeout;
let lastTap = 0;

// --- FUNÇÕES DE APOIO ---

const handleEdit = (card) => {
    card.contentEditable = "true";
    card.focus();
};

const createNewCard = (column) => {
    const card = document.createElement("section");
    card.className = "card baixa"; // Inicia como baixa por padrão
    card.draggable = "true";

    // Estrutura Interna: Checkbox + Área de Texto + Select
    card.innerHTML = `
        <div class="card__header">
            <input type="checkbox" class="card__check">
            <div class="card__text" contenteditable="true"></div>
        </div>
        <select class="card__importancia">
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Importante</option>
        </select>
    `;

    const textArea = card.querySelector(".card__text");
    const checkbox = card.querySelector(".card__check");
    const select = card.querySelector(".card__importancia");

    // --- Lógica do Checkbox (Taxado) ---
    checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
            card.classList.add("card__taxado");
        } else {
            card.classList.remove("card__taxado");
        }
    });

    // --- Lógica da Importância (Cores) ---
    select.addEventListener("change", () => {
        // Remove classes anteriores e adiciona a nova
        card.classList.remove("baixa", "media", "alta");
        card.classList.add(select.value);
    });

    // --- Lógica de Edição/Foco ---
    textArea.addEventListener("focusout", () => {
        if (!textArea.textContent.trim()) {
            card.remove();
        }
    });

    // Reatribui eventos de drag e touch para o novo card
    card.addEventListener("dragstart", dragStart);
    addTouchEvents(card);
    
    column.append(card);
    textArea.focus();
};

// --- LÓGICA DE TOQUE (MOBILE) ---

const addTouchEvents = (card) => {
    card.addEventListener("touchstart", (e) => {
        // Se o toque for no Select ou Checkbox, não inicia o Drag
        if (e.target.tagName === "SELECT" || e.target.type === "checkbox") return;

        const now = Date.now();
        if (now - lastTap < 300) {
            const textArea = card.querySelector(".card__text");
            textArea.focus();
            return;
        }
        lastTap = now;

        touchTimeout = setTimeout(() => {
            draggedCard = card;
            card.style.opacity = "0.5";
        }, 500); 
    }, { passive: true });

    card.addEventListener("touchend", () => {
        clearTimeout(touchTimeout);
        if (draggedCard) {
            draggedCard.style.opacity = "1";
            draggedCard = null;
        }
    });

    card.addEventListener("touchmove", (e) => {
        if (!draggedCard) return;
        
        // Impede scroll apenas se estiver de fato arrastando um card
        e.preventDefault(); 

        const touch = e.touches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        const column = targetElement?.closest(".column__cards");

        if (column) {
            column.appendChild(draggedCard);
        }
    }, { passive: false });
};

// --- LÓGICA DE MOUSE (DESKTOP) ---

const dragStart = (event) => {
    draggedCard = event.target;
    event.dataTransfer.effectAllowed = "move";
};

const dragsOver = (event) => event.preventDefault();

const dragsEnter = ({ target }) => {
    if (target.classList.contains("column__cards")) {
        target.classList.add("column--highlight");
    }
};

const dragsLeave = ({ target }) => {
    target.classList.remove("column--highlight");
};

const drop = ({ target }) => {
    if (target.classList.contains("column__cards")) {
        target.classList.remove("column--highlight");
        target.append(draggedCard);
    }
};

// --- INICIALIZAÇÃO ---

columns.forEach((column) => {
    column.addEventListener("dragover", dragsOver);
    column.addEventListener("dragenter", dragsEnter);
    column.addEventListener("dragleave", dragsLeave);
    column.addEventListener("drop", drop);

    // Desktop: Double Click | Mobile: Simularemos no touch da coluna
    column.addEventListener("dblclick", (e) => {
        if (e.target === column) createNewCard(column);
    });

    // Mobile: Toque duplo na coluna para criar card
    column.addEventListener("touchstart", (e) => {
        if (e.target !== column) return;
        const now = Date.now();
        if (now - lastTap < 100) {
            createNewCard(column);
        }
        lastTap = now;
    });
});

// Inicializa cards existentes
document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("dragstart", dragStart);
    addTouchEvents(card);
});