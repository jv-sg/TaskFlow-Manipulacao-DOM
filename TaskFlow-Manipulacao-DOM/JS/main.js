// =============================================
//  TaskFlow — main.js
//  Features: localStorage, drag & drop, touch, PWA
// =============================================

'use strict';

// ---- PWA: Register Service Worker ----
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('../sw.js')
            .then(reg => console.log('[SW] Registered:', reg.scope))
            .catch(err => console.warn('[SW] Registration failed:', err));
    });
}

// ---- Constants ----
const STORAGE_KEY = 'taskflow_cards_v2';
const HINT_KEY = 'taskflow_hint_dismissed';

// ---- State ----
let cards = [];         // Array of card objects
let draggedCard = null;
let touchTimeout = null;
let lastTap = 0;

// ---- Card Object Shape ----
// { id, text, priority, checked, columnId, order }

// ---- DOM References ----
const columns = document.querySelectorAll('.column__cards');
const toast = document.getElementById('toast');
const totalCardsEl = document.getElementById('totalCards');
const hintBar = document.getElementById('hintBar');
const addHintBtn = document.getElementById('addHintBtn');

// ---- Storage ----
const loadCards = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
};

const saveCards = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    updateStats();
};

// ---- Toast Notification ----
let toastTimeout;
const showToast = (msg) => {
    clearTimeout(toastTimeout);
    toast.textContent = msg;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
};

// ---- Stats ----
const updateStats = () => {
    const total = cards.length;
    totalCardsEl.textContent = `${total} card${total !== 1 ? 's' : ''}`;

    // Update column counts
    document.querySelectorAll('.columns-column').forEach(col => {
        const colId = col.dataset.column;
        const count = cards.filter(c => c.columnId === colId).length;
        const countEl = document.getElementById(`count-${colId}`);
        if (countEl) countEl.textContent = count;
    });
};

// ---- Generate ID ----
const genId = () => `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ---- Render all cards from state ----
const renderAll = () => {
    // Clear all columns
    columns.forEach(col => col.innerHTML = '');

    // Sort by order within each column
    const sorted = [...cards].sort((a, b) => a.order - b.order);
    sorted.forEach(cardData => {
        const colEl = document.querySelector(`.column__cards[data-column-id="${cardData.columnId}"]`);
        if (colEl) {
            const cardEl = buildCardElement(cardData);
            colEl.appendChild(cardEl);
        }
    });

    updateStats();
};

// ---- Build card DOM from data object ----
const buildCardElement = (cardData) => {
    const card = document.createElement('div');
    card.className = `card ${cardData.priority}${cardData.checked ? ' card__taxado' : ''}`;
    card.draggable = true;
    card.dataset.cardId = cardData.id;

    card.innerHTML = `
        <div class="card__header">
            <input type="checkbox" class="card__check" ${cardData.checked ? 'checked' : ''}>
            <div class="card__text" contenteditable="true">${escapeHtml(cardData.text)}</div>
        </div>
        <div class="card__footer">
            <select class="card__importancia">
                <option value="baixa"${cardData.priority === 'baixa' ? ' selected' : ''}>🟢 Baixa</option>
                <option value="media"${cardData.priority === 'media' ? ' selected' : ''}>🟡 Média</option>
                <option value="alta"${cardData.priority === 'alta' ? ' selected' : ''}>🔴 Alta</option>
            </select>
            <button class="card__delete" title="Remover card" aria-label="Remover card">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
        </div>
    `;

    const textArea = card.querySelector('.card__text');
    const checkbox = card.querySelector('.card__check');
    const select = card.querySelector('.card__importancia');
    const deleteBtn = card.querySelector('.card__delete');

    // Checkbox
    checkbox.addEventListener('change', () => {
        const data = cards.find(c => c.id === cardData.id);
        if (data) {
            data.checked = checkbox.checked;
            card.classList.toggle('card__taxado', checkbox.checked);
            saveCards();
        }
    });

    // Priority select
    select.addEventListener('change', () => {
        const data = cards.find(c => c.id === cardData.id);
        if (data) {
            card.classList.remove('baixa', 'media', 'alta');
            card.classList.add(select.value);
            data.priority = select.value;
            saveCards();
        }
    });

    // Text editing
    textArea.addEventListener('blur', () => {
        const text = textArea.textContent.trim();
        const data = cards.find(c => c.id === cardData.id);
        if (!text) {
            // Remove card if empty on blur
            cards = cards.filter(c => c.id !== cardData.id);
            card.remove();
            saveCards();
            showToast('Card removido');
            return;
        }
        if (data) {
            data.text = text;
            saveCards();
        }
    });

    textArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            textArea.blur();
        }
    });

    // Delete button
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cards = cards.filter(c => c.id !== cardData.id);
        card.style.transition = 'all 0.2s';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => {
            card.remove();
            saveCards();
        }, 200);
        showToast('Card removido');
    });

    // Drag events
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragend', onDragEnd);

    // Touch events
    addTouchEvents(card);

    return card;
};

// ---- Create new card ----
const createNewCard = (columnId) => {
    const colEl = document.querySelector(`.column__cards[data-column-id="${columnId}"]`);
    if (!colEl) return;

    const maxOrder = cards.length > 0 ? Math.max(...cards.map(c => c.order)) : 0;

    const cardData = {
        id: genId(),
        text: '',
        priority: 'baixa',
        checked: false,
        columnId,
        order: maxOrder + 1
    };

    cards.push(cardData);

    const cardEl = buildCardElement(cardData);
    colEl.appendChild(cardEl);
    updateStats();

    // Focus on text area
    const textArea = cardEl.querySelector('.card__text');
    textArea.focus();

    // Scroll to new card
    cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// ---- Escape HTML to prevent XSS ----
const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

// ---- Sync card orders after drop ----
const syncColumnOrder = (colEl) => {
    const colId = colEl.dataset.columnId;
    const cardEls = colEl.querySelectorAll('.card');
    cardEls.forEach((el, i) => {
        const data = cards.find(c => c.id === el.dataset.cardId);
        if (data) {
            data.columnId = colId;
            data.order = i;
        }
    });
};

// ---- DRAG & DROP (Desktop) ----
const onDragStart = (e) => {
    draggedCard = e.currentTarget;
    draggedCard.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedCard.dataset.cardId);
};

const onDragEnd = () => {
    if (draggedCard) {
        draggedCard.classList.remove('dragging');
        draggedCard = null;
    }
};

const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

const onDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('column--highlight');
};

const onDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
        e.currentTarget.classList.remove('column--highlight');
    }
};

const onDrop = (e) => {
    e.preventDefault();
    const colEl = e.currentTarget;
    colEl.classList.remove('column--highlight');

    if (draggedCard) {
        colEl.appendChild(draggedCard);
        syncColumnOrder(colEl);
        // Also sync old column if it was different
        saveCards();
    }
};

// ---- TOUCH DRAG (Mobile) ----
const addTouchEvents = (card) => {
    card.addEventListener('touchstart', (e) => {
        if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox' || e.target.tagName === 'BUTTON') return;

        const now = Date.now();
        if (now - lastTap < 280) {
            // Double tap = edit
            const textArea = card.querySelector('.card__text');
            textArea.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(textArea);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            return;
        }
        lastTap = now;

        touchTimeout = setTimeout(() => {
            draggedCard = card;
            card.classList.add('dragging');
        }, 450);
    }, { passive: true });

    card.addEventListener('touchend', () => {
        clearTimeout(touchTimeout);
        if (draggedCard) {
            draggedCard.classList.remove('dragging');
            draggedCard = null;
        }
    });

    card.addEventListener('touchmove', (e) => {
        if (!draggedCard) return;
        e.preventDefault();

        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const colEl = target?.closest('.column__cards');

        if (colEl && colEl !== draggedCard.parentElement) {
            colEl.appendChild(draggedCard);
            syncColumnOrder(colEl);
        }
    }, { passive: false });
};

// ---- Column click/double-click to create card ----
const setupColumns = () => {
    columns.forEach((colEl) => {
        colEl.addEventListener('dragover', onDragOver);
        colEl.addEventListener('dragenter', onDragEnter);
        colEl.addEventListener('dragleave', onDragLeave);
        colEl.addEventListener('drop', (e) => {
            onDrop(e);
            saveCards();
        });

        // Desktop double-click on empty area
        colEl.addEventListener('dblclick', (e) => {
            if (e.target === colEl) {
                createNewCard(colEl.dataset.columnId);
            }
        });

        // Mobile double-tap on empty area
        colEl.addEventListener('touchstart', (e) => {
            if (e.target !== colEl) return;
            const now = Date.now();
            if (now - lastTap < 300) {
                createNewCard(colEl.dataset.columnId);
            }
            lastTap = now;
        });
    });
};

// ---- Add card buttons ----
const setupAddButtons = () => {
    document.querySelectorAll('.btn-add-card').forEach(btn => {
        btn.addEventListener('click', () => {
            createNewCard(btn.dataset.columnId);
        });
    });

    // Header button: creates card in first column (To Do)
    addHintBtn?.addEventListener('click', () => {
        createNewCard('todo');
    });
};

// ---- Hint bar dismiss ----
const setupHint = () => {
    if (localStorage.getItem(HINT_KEY)) {
        hintBar?.classList.add('hidden');
        return;
    }
    setTimeout(() => {
        if (hintBar) {
            hintBar.style.transition = 'all 0.4s ease';
            hintBar.style.opacity = '0';
            hintBar.style.maxHeight = '0';
            hintBar.style.padding = '0';
            setTimeout(() => hintBar.classList.add('hidden'), 400);
        }
        localStorage.setItem(HINT_KEY, '1');
    }, 6000);
};

// ---- Init ----
const init = () => {
    cards = loadCards();
    setupColumns();
    setupAddButtons();
    renderAll();
    setupHint();
    console.log(`[TaskFlow] Loaded ${cards.length} cards`);
};

init();
