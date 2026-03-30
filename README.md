# TaskFlow — Documentação Técnica

> **Contexto:** Estudo prático sobre manipulação do DOM com JavaScript Vanilla, estilização responsiva com CSS puro e configuração completa de uma Progressive Web App (PWA).

**Autor:** João Victor Gomes (Jhonny)
**Curso:** Análise e Desenvolvimento de Sistemas — FIAP
**Tecnologias:** HTML5 · CSS3 · JavaScript ES6+ · Service Workers · Web App Manifest
**Versão:** 2.0 — Refatorado
**Link do site navegavel:** https://jv-sg.github.io/TaskFlow-Manipulacao-DOM/

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Estrutura do Projeto](#2-estrutura-do-projeto)
3. [Manipulação do DOM com JavaScript Vanilla](#3-manipulação-do-dom-com-javascript-vanilla)
4. [Persistência com localStorage](#4-persistência-com-localstorage)
5. [Drag & Drop — Desktop e Mobile](#5-drag--drop--desktop-e-mobile)
6. [CSS — Design System e Responsividade](#6-css--design-system-e-responsividade)
7. [Progressive Web App (PWA)](#7-progressive-web-app-pwa)
8. [Bugs Corrigidos na Refatoração](#8-bugs-corrigidos-na-refatoração)
9. [Conceitos Web Fundamentais Aplicados](#9-conceitos-web-fundamentais-aplicados)
10. [Como Executar o Projeto](#10-como-executar-o-projeto)
11. [Checklist de Requisitos PWA](#11-checklist-de-requisitos-pwa)

---

## 1. Visão Geral

O **TaskFlow** é um gerenciador de tarefas no formato Kanban Board desenvolvido integralmente com tecnologias web nativas — sem frameworks, sem bibliotecas de UI, sem transpiladores. O projeto integra um estudo prático sobre três grandes temas:

- **Manipulação dinâmica do DOM** com JavaScript Vanilla
- **Persistência de dados no cliente** via localStorage
- **Configuração de uma PWA** com Service Worker e Web App Manifest

A interface apresenta quatro colunas de status (To Do, In Progress, Revisar, Finalizado) com cards que podem ser criados, editados, priorizados, marcados como concluídos e arrastados entre colunas. Todos os dados persistem entre sessões via `localStorage`, e a aplicação funciona offline após a primeira visita graças ao Service Worker.

### Objetivos de Aprendizado

- Compreender o DOM (Document Object Model) e sua manipulação via JavaScript puro
- Criar, editar e remover elementos HTML dinamicamente sem reload de página
- Implementar persistência de dados no cliente com a API `localStorage`
- Configurar uma PWA completa com Web App Manifest e Service Worker
- Desenvolver interfaces responsivas com CSS moderno (Custom Properties, Flexbox, scroll-snap)
- Implementar Drag & Drop API para desktop e Touch API para mobile

---

## 2. Estrutura do Projeto

O projeto segue uma estrutura simples de arquivos estáticos, sem etapa de build. Todos os arquivos são servidos diretamente pelo navegador:

```
taskflow/
├── index.html              # Markup principal da aplicação
├── manifest.json           # Web App Manifest (metadados PWA)
├── service-worker.js       # Service Worker (cache offline)
├── css/
│   └── main.css            # Estilos globais e responsivos
├── js/
│   └── main.js             # Lógica da aplicação (DOM + localStorage)
├── icones/
│   ├── icon-192.png        # Ícone PWA 192×192
│   └── icon-512.png        # Ícone PWA 512×512
└── screenshots/
    └── screen.png          # Screenshot para o manifest
```

---

## 3. Manipulação do DOM com JavaScript Vanilla

O core do projeto é a criação e manipulação dinâmica de elementos HTML via JavaScript. Nenhum card existe no HTML estático — todos são criados, atualizados e removidos programaticamente.

### 3.1 Criação Dinâmica de Elementos

A função `createNewCard()` exemplifica o fluxo completo de criação de um nó no DOM:

```js
const createNewCard = (columnId) => {
    // 1. Cria o elemento
    const card = document.createElement("div");
    card.className = "card baixa";
    card.draggable = true;
    card.dataset.cardId = cardData.id;

    // 2. Define o innerHTML com a estrutura interna
    card.innerHTML = `
        <div class="card__header">
            <input type="checkbox" class="card__check">
            <div class="card__text" contenteditable="true"></div>
        </div>
    `;

    // 3. Seleciona subelementos e adiciona event listeners
    const textArea = card.querySelector(".card__text");
    textArea.addEventListener("blur", () => saveCard());

    // 4. Insere no DOM e foca para edição imediata
    colEl.appendChild(card);
    textArea.focus();
};
```

> **Conceito: `contenteditable`**
> O atributo `contenteditable="true"` permite que qualquer elemento HTML se torne editável pelo usuário, funcionando como um campo de texto rico. O projeto usa esse recurso nos cards para edição inline do texto, sem necessidade de um `<input>` separado.

### 3.2 Seleção e Travessia do DOM

O projeto demonstra as principais APIs de seleção do DOM e como navegar entre elementos:

```js
// Seleciona múltiplos elementos (retorna NodeList)
const columns = document.querySelectorAll(".column__cards");

// Seleciona um único elemento dentro de um nó
const textArea = card.querySelector(".card__text");

// Navega para o elemento pai mais próximo com o seletor
const colEl = target?.closest(".column__cards");

// Filtra elementos filhos por classe
const cardsInColumn = [...colEl.children].filter(el =>
    el.classList.contains("card")
);
```

### 3.3 Gerenciamento de Eventos

O projeto utiliza `addEventListener` extensivamente, cobrindo eventos de mouse, teclado e toque. Um padrão importante é a **delegação de eventos** — um listener na coluna-pai captura eventos de todos os cards filhos:

```js
// Event delegation: listener na coluna captura eventos dos cards
column.addEventListener("dblclick", (e) => {
    if (e.target === column) createNewCard(column.dataset.columnId);
});

// Evento com opção passive: melhora performance no scroll mobile
card.addEventListener("touchstart", handler, { passive: true });

// Evento com preventDefault para controlar o comportamento padrão
card.addEventListener("touchmove", (e) => {
    if (!draggedCard) return;
    e.preventDefault(); // bloqueia scroll apenas durante drag
}, { passive: false });
```

---

## 4. Persistência com localStorage

O `localStorage` é uma API do Web Storage que armazena dados no navegador de forma síncrona e persistente entre sessões, com escopo por origem (protocolo + domínio + porta). O TaskFlow usa para salvar o estado completo do board.

### 4.1 Estrutura dos Dados

Cada card é representado como um objeto JavaScript serializado em JSON:

```js
{
    id:       "card_1711234567_ab3f9",   // ID único gerado
    text:     "Implementar autenticação", // conteúdo do card
    priority: "alta",                    // "baixa" | "media" | "alta"
    checked:  false,                     // estado do checkbox
    columnId: "in-progress",             // coluna atual
    order:    3                          // posição na coluna
}
```

### 4.2 Operações de Leitura e Escrita

```js
const STORAGE_KEY = "taskflow_cards_v2";

// LEITURA: ao inicializar a aplicação
const loadCards = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return []; // retorna vazio se o JSON estiver corrompido
    }
};

// ESCRITA: após qualquer mudança de estado
const saveCards = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    updateStats();
};
```

### 4.3 Ciclo de Vida dos Dados

| Evento | Ação no localStorage |
|---|---|
| App inicializa | `loadCards()` lê e parseia o JSON; `renderAll()` reconstrói o DOM |
| Card criado | Objeto adicionado ao array `cards[]` + `saveCards()` |
| Texto editado (blur) | `data.text` atualizado + `saveCards()` |
| Card movido (drop) | `data.columnId` e `data.order` atualizados + `saveCards()` |
| Card excluído | `cards.filter()` remove o objeto + `saveCards()` |
| Checkbox alterado | `data.checked` atualizado + `saveCards()` |

> **⚠️ Bug Corrigido**
> Na versão original, o código lia `localStorage.getItem("card")` mas escrevia com `.setItem("cards")` — duas chaves diferentes. Os cards nunca eram recuperados ao recarregar a página. A correção foi centralizar a chave em uma constante `STORAGE_KEY` usada em todas as operações.

---

## 5. Drag & Drop — Desktop e Mobile

O projeto implementa duas estratégias paralelas de arrastar-e-soltar: a HTML5 Drag & Drop API (nativa para mouse) e eventos de toque (Touch API) para dispositivos móveis.

### 5.1 HTML5 Drag & Drop API (Desktop)

```js
// No card: inicia o drag
card.addEventListener("dragstart", (e) => {
    draggedCard = e.currentTarget;
    draggedCard.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
});

// Na coluna: aceita o drop
column.addEventListener("dragover",  (e) => e.preventDefault());
column.addEventListener("dragenter", (e) => {
    e.currentTarget.classList.add("column--highlight");
});
column.addEventListener("dragleave", (e) => {
    e.currentTarget.classList.remove("column--highlight");
});
column.addEventListener("drop", (e) => {
    e.currentTarget.classList.remove("column--highlight");
    e.currentTarget.appendChild(draggedCard); // move no DOM
    syncColumnOrder(e.currentTarget);          // sincroniza estado
    saveCards();
});
```

### 5.2 Touch API (Mobile)

Como a Drag & Drop API não funciona bem em dispositivos móveis, o projeto implementa a mesma experiência com eventos de toque, usando `elementFromPoint` para detectar a coluna de destino:

```js
card.addEventListener("touchmove", (e) => {
    if (!draggedCard) return;
    e.preventDefault(); // impede scroll da página durante drag

    const touch = e.touches[0];
    // Descobre qual elemento está sob o dedo do usuário
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const colEl = target?.closest(".column__cards");

    if (colEl && colEl !== draggedCard.parentElement) {
        colEl.appendChild(draggedCard);
        syncColumnOrder(colEl);
    }
}, { passive: false }); // passive: false obrigatório para usar preventDefault
```

---

## 6. CSS — Design System e Responsividade

O CSS do projeto utiliza Custom Properties (variáveis CSS) para manter um design system coeso, Flexbox para layouts e media queries para responsividade.

### 6.1 Custom Properties (Variáveis CSS)

```css
:root {
    /* Paleta principal */
    --bg-primary:   #0f1117;
    --bg-column:    #1a1d27;
    --bg-card:      #1f2235;
    --text-primary: #f0f0f8;

    /* Acentos por status de coluna */
    --accent-todo:     #6c63ff;
    --accent-progress: #f59e0b;
    --accent-review:   #ec4899;
    --accent-done:     #10b981;

    /* Tokens de prioridade */
    --priority-low:    #10b981;
    --priority-medium: #f59e0b;
    --priority-high:   #ef4444;

    /* Transição padrão */
    --transition: 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 6.2 Layout Responsivo

O board usa Flexbox com `overflow-x: auto`. Em mobile, o `scroll-snap` garante que o usuário sempre veja uma coluna por vez, alinhada perfeitamente:

```css
/* Desktop: colunas side-by-side com scroll horizontal */
.main-columns {
    display: flex;
    gap: 1.6rem;
    overflow-x: auto;
}

/* Mobile: cada coluna ocupa 82% da viewport */
@media (max-width: 600px) {
    .main-columns {
        scroll-snap-type: x mandatory;    /* snap suave entre colunas */
        -webkit-overflow-scrolling: touch; /* aceleração nativa iOS */
    }
    .columns-column {
        flex: 0 0 82vw;
        scroll-snap-align: start; /* alinha no início ao fazer snap */
    }
}
```

---

## 7. Progressive Web App (PWA)

Uma PWA é uma aplicação web que utiliza APIs modernas do navegador para oferecer uma experiência similar a apps nativos: instalação na tela inicial, funcionamento offline e carregamento instantâneo.

### 7.1 Os Três Pilares da PWA

| Pilar | Implementação no TaskFlow |
|---|---|
| Seguro (HTTPS) | Requisito do navegador para registrar Service Workers. Em dev, `localhost` é considerado seguro. |
| Web App Manifest | `manifest.json` define nome, ícones, cores e modo `standalone` (sem barra do navegador). |
| Service Worker | `service-worker.js` implementa cache-first para assets e funciona offline. |

### 7.2 Web App Manifest

O `manifest.json` é o arquivo de identidade da PWA. Ele instrui o navegador sobre como apresentar a app quando instalada:

```json
{
    "name": "TaskFlow",
    "short_name": "TaskFlow",
    "start_url": "./index.html",
    "display": "standalone",
    "orientation": "any",
    "theme_color": "#0f1117",
    "background_color": "#0f1117",
    "icons": [
        { "src": "icones/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
        { "src": "icones/icon-512.png",  "sizes": "512x512",  "type": "image/png", "purpose": "any maskable" }
    ],
    "screenshots": [
        { "src": "screenshots/screen.png", "form_factor": "wide" }
    ]
}
```

### 7.3 Service Worker e Cache API

O Service Worker é um script que roda em background, separado da thread principal. Ele intercepta requisições de rede e pode responder com dados em cache, possibilitando o uso offline.

**Registro correto no `main.js`:**

```js
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then(reg => console.log('[SW] Registered:', reg.scope))
            .catch(err => console.warn('[SW] Registration failed:', err));
    });
}
```

**Estratégia Cache-First no `service-worker.js`:**

```js
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached; // retorna do cache imediatamente

            // Não está em cache: busca na rede e armazena
            return fetch(event.request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, clone));
                return response;
            });
        })
    );
});
```

> **⚠️ Bug Crítico Corrigido**
> Na versão original, o `service-worker.js` era carregado via `<script src="service-worker.js">` no HTML — o que apenas executa o arquivo como um script comum, sem registrá-lo como Service Worker. O navegador exige o registro via `navigator.serviceWorker.register()` para instalar e controlar o SW corretamente.

### 7.4 Ciclo de Vida do Service Worker

```
Install   →  caches.addAll() pré-carrega todos os assets definidos em ASSETS[]
    ↓
Activate  →  remove caches antigos de versões anteriores
    ↓
Fetch     →  intercepta requisições e aplica a estratégia cache-first com fallback de rede
```

---

## 8. Bugs Corrigidos na Refatoração

| # | Problema | Causa | Correção |
|---|---|---|---|
| 1 | Cards não persistiam entre sessões | Chave inconsistente: lia `"card"`, escrevia em `"cards"`; `renderAll()` nunca chamado | Chave `STORAGE_KEY` centralizada; `renderAll()` executado na inicialização |
| 2 | PWA não instalável | SW carregado via `<script>` em vez de `navigator.serviceWorker.register()` | Registro correto no `main.js` com verificação de suporte |
| 3 | Layout quebrado no mobile | `min-width: 400px` fixo nas colunas; sem scroll-snap | Colunas em `82vw` + `scroll-snap-type: x mandatory` |
| 4 | `start_url` inválido no manifest | Caminho relativo apontando para subpasta inexistente | Estrutura flat com caminhos corrigidos |

---

## 9. Conceitos Web Fundamentais Aplicados

### 9.1 DOM (Document Object Model)

O DOM é a representação em árvore do documento HTML na memória do navegador. Cada tag HTML se torna um nó (Node) nessa árvore, que pode ser lido e modificado via JavaScript. O TaskFlow manipula o DOM em tempo real — sem reload — para criar, mover e remover cards.

### 9.2 Event Loop e Assincronicidade

O JavaScript é single-threaded, mas usa o Event Loop para processar eventos de forma não-blocante. Os `addEventListener`s do projeto são callbacks registrados no event loop — eles só executam quando o evento correspondente ocorre, sem bloquear a thread principal.

### 9.3 Web Storage API

O `localStorage` e o `sessionStorage` fazem parte da Web Storage API. O `localStorage` persiste os dados indefinidamente (até limpeza manual), enquanto o `sessionStorage` os apaga ao fechar a aba. Ambos armazenam apenas strings — por isso o uso de `JSON.stringify()` e `JSON.parse()` é essencial para objetos JavaScript.

### 9.4 Service Workers e Cache API

Service Workers são scripts que o navegador executa em uma thread separada, atuando como proxy entre a aplicação e a rede. A Cache API (usada dentro do SW) armazena pares de Request/Response, permitindo servir recursos sem conexão de internet.

### 9.5 CSS Custom Properties

As Custom Properties (`--variavel: valor`) são variáveis nativas do CSS, sem necessidade de preprocessadores. Diferente das variáveis do Sass, elas são dinâmicas — podem ser alteradas via JavaScript em tempo de execução — e respeitam o escopo de cascata do CSS.

---

## 10. Como Executar o Projeto

Por usar Service Workers, a aplicação precisa ser servida via HTTP — não pode ser aberta como arquivo local `file://`. Para desenvolvimento:

**Opção 1: VS Code Live Server**
```
1. Instale a extensão Live Server no VS Code
2. Clique com botão direito em index.html → "Open with Live Server"
3. Acesse http://127.0.0.1:5500
```

**Opção 2: Python HTTP Server**
```bash
cd taskflow/
python -m http.server 8080
# Acesse: http://localhost:8080
```

**Opção 3: Node.js**
```bash
npx serve taskflow/
# ou
npx http-server taskflow/ -p 8080
```

> **📱 Instalando como PWA**
> Com a aplicação aberta no Chrome (desktop ou Android), clique no ícone de instalação na barra de endereço ou use o menu ⋮ → "Instalar aplicativo". No iOS Safari, use o botão Compartilhar → "Adicionar à Tela de Início".

---

## 11. Checklist de Requisitos PWA

| Status | Requisito | Arquivo |
|---|---|---|
| ✅ | Servido via HTTPS (ou localhost) | Requisito base |
| ✅ | Web App Manifest válido com `name`, `icons` e `start_url` | `manifest.json` |
| ✅ | Ícones 192×192 e 512×512 | `icones/` |
| ✅ | Service Worker registrado corretamente | `main.js` + `service-worker.js` |
| ✅ | Estratégia de cache implementada | Cache-First no SW |
| ✅ | Funciona offline após primeira visita | Cache API |
| ✅ | `display: standalone` no manifest | Sem barra do browser |
| ✅ | `theme_color` e `background_color` definidos | `manifest.json` |
| ✅ | Meta `viewport` configurado | `index.html` |
| ✅ | `apple-mobile-web-app-capable` (iOS) | `index.html` |

---

*TaskFlow — Documentação Técnica v2.0 · João Victor Gomes · FIAP · ADS*