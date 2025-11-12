document.addEventListener("DOMContentLoaded", () => {

  // --- GRUPO 1: CONSTANTES E ELEMENTOS ---

  const STORAGE_KEY = 'JIUJITSU_PLACES_DB';

  // Banco de dados falso de lutadores
  const MOCK_FIGHTERS = {
    branca: ["Carlos (Branca)", "Ana (Branca)", "Gabriel (Branca)", "Sofia (Branca)"],
    azul: ["Bruno (Azul)", "Beatriz (Azul)", "Rafael (Azul)", "Clara (Azul)", "Davi (Azul)"],
    roxa: ["Ricardo (Roxa)", "Fernanda (Roxa)", "Thiago (Roxa)"],
    marrom: ["Marcelo (Marrom)", "Vanessa (Marrom)", "Felipe (Marrom)"],
    preta: ["Leonardo (Preta)", "Juliana (Preta)", "Mestre Helio (Preta)", "Mestre Carlos (Preta)"]
  };

  // Elementos do Modal de Display
  const displayModal = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const locEl = document.getElementById("modal-location");
  const descEl = document.getElementById("modal-desc");
  const extraEl = document.getElementById("modal-extra");
  const closeBtn = document.getElementById("modal-close");
  const actionBtn = document.getElementById("modal-action");
  const deleteBtn = document.getElementById("modal-delete");
  const modalParticipantesEl = document.getElementById("modal-participantes");
  const modalPremiacaoEl = document.getElementById("modal-premiacao");

  // Elementos do Grid
  const grid = document.getElementById("cards");

  // Elementos do Modal de Criação
  const createBtn = document.getElementById("create-btn");
  const createModal = document.getElementById("create-modal");
  const createModalCloseBtn = document.getElementById("create-modal-close");
  const createForm = document.getElementById("create-form");
  const page1 = document.getElementById("create-page-1");
  const page2 = document.getElementById("create-page-2");
  const navPage1 = document.getElementById("nav-page-1");
  const navPage2 = document.getElementById("nav-page-2");
  const nextBtn = document.getElementById("next-btn");
  const backBtn = document.getElementById("back-btn");
  const saveBtn = document.getElementById("save-btn");
  const newTitleInput = document.getElementById("new-title");
  const newDescInput = document.getElementById("new-desc");

  // Elementos do Formulário de Participantes
  const eventTypeSelect = document.getElementById("new-event-type");
  const participantsOpenGroup = document.getElementById("participants-open-group");
  const participantsClosedGroup = document.getElementById("participants-closed-group");
  const beltTabsContainer = document.getElementById("belt-tabs");
  const fighterSelectionBox = document.getElementById("fighter-selection-box");
  const selectedFightersPreview = document.getElementById("selected-fighters-preview");
  const participantsClosedInput = document.getElementById("new-participantes-closed");

  // Variável de estado para rastrear seleções
  let selectedFighters = [];


  // --- GRUPO 2: FUNÇÕES DO MODAL DE DISPLAY ---

  /**
   * Abre o modal de visualização com os dados do card clicado.
   * @param {HTMLElement} card - O elemento do card que foi clicado.
   */
  function openModalFromCard(card) {
    // Lê os dados do card clicado
    const title = card.dataset.title || "";
    const location = card.dataset.location || "";
    const desc = card.dataset.desc || "";
    const extra = card.dataset.extra || "";
    const cardId = card.dataset.id;
    const eventType = card.dataset.eventType || "open";
    const participantes = card.dataset.participantes || "Não informado.";
    const premiacao = card.dataset.premiacao || "Não informado.";

    // Preenche o modal
    titleEl.textContent = title;
    locEl.textContent = location;
    descEl.textContent = desc;
    extraEl.textContent = extra;
    modalPremiacaoEl.textContent = premiacao;

    // Lógica de Participantes (Aberto vs Fechado)
    if (eventType === 'closed' && participantes.trim() !== "Não informado." && participantes.trim() !== "") {
      // Se for 'closed', transforma a lista (separada por vírgula) em <ul>
      const names = participantes.split(',');
      modalParticipantesEl.innerHTML = `<ul>${names.map(name => `<li>${name.trim()}</li>`).join('')}</ul>`;
    } else {
      // Se for 'open' ou não informado, usa o texto simples (com pre-wrap)
      modalParticipantesEl.textContent = participantes;
    }

    // Mostra o modal
    displayModal.style.display = "flex";
    displayModal.setAttribute("aria-hidden", "false");
    closeBtn.focus();

    // Lógica de "Pode Deletar"
    const userCanDelete = true; // Sempre true, como solicitado
    if (userCanDelete) {
      deleteBtn.style.display = "block";
      deleteBtn.onclick = () => {
        handleDeleteCard(cardId, card);
      };
    } else {
      deleteBtn.style.display = "none";
    }

    // Google Maps
    actionBtn.onclick = () => {
      const q = encodeURIComponent(title + " " + location);
      window.open(
        "https://www.google.com/maps/search/?api:1&query=" + q,
        "_blank"
      );
    };
  }

  /**
   * Fecha o modal de visualização.
   */
  function closeModal() {
    displayModal.style.display = "none";
    displayModal.setAttribute("aria-hidden", "true");
  }


  // --- GRUPO 3: FUNÇÕES DO MODAL DE CRIAÇÃO ---

  /**
   * Abre e reseta o modal de criação.
   */
  function openCreateModal() {
    createForm.reset();
    selectedFighters = []; // Limpa a seleção
    updateParticipantUI(); // Garante que a UI de "Aberto" é mostrada
    renderFighterList('branca'); // Pré-carrega a lista de faixas brancas
    updateSelectedFightersDisplay(); // Limpa a tela
    page1.style.display = "block";
    page2.style.display = "none";
    navPage1.style.display = "flex";
    navPage2.style.display = "none";
    validateStep1();
    createModal.style.display = "flex";
    createModal.setAttribute("aria-hidden", "false");
    newTitleInput.focus();
  }

  /**
   * Fecha o modal de criação.
   */
  function closeCreateModal() {
    createModal.style.display = "none";
    createModal.setAttribute("aria-hidden", "true");
  }

  /**
   * Navega para a página 2 (Tags) do modal de criação.
   */
  function goToCreatePage2() {
    page1.style.display = "none";
    page2.style.display = "block";
    navPage1.style.display = "none";
    navPage2.style.display = "flex";
  }

  /**
   * Navega de volta para a página 1 (Dados) do modal de criação.
   */
  function goToCreatePage1() {
    page1.style.display = "block";
    page2.style.display = "none";
    navPage1.style.display = "flex";
    navPage2.style.display = "none";
  }

  /**
   * Valida se os campos obrigatórios (Título e Descrição) da página 1 estão preenchidos.
   */
  function validateStep1() {
    const titleFilled = newTitleInput.value.trim() !== "";
    const descFilled = newDescInput.value.trim() !== "";
    if (titleFilled && descFilled) {
      nextBtn.disabled = false;
    } else {
      nextBtn.disabled = true;
    }
  }


  // --- GRUPO 4: FUNÇÕES DO SELETOR DE PARTICIPANTES ---

  /**
   * Alterna a visibilidade dos campos de participantes (Aberto vs. Fechado)
   * com base na seleção do dropdown.
   */
  function updateParticipantUI() {
    const eventType = eventTypeSelect.value;
    if (eventType === 'open') {
      participantsOpenGroup.style.display = 'block';
      participantsClosedGroup.style.display = 'none';
    } else { // 'closed'
      participantsOpenGroup.style.display = 'none';
      participantsClosedGroup.style.display = 'block';
    }
  }

  /**
   * Renderiza a lista de checkboxes de lutadores para a faixa selecionada.
   * @param {string} belt - A faixa (ex: "branca", "azul").
   */
  function renderFighterList(belt) {
    // Atualiza o 'active' da aba
    document.querySelectorAll('.belt-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.belt === belt);
    });

    const fighters = MOCK_FIGHTERS[belt] || [];
    fighterSelectionBox.innerHTML = fighters.map(name => `
      <label>
        <input type="checkbox" data-name="${name}" ${selectedFighters.includes(name) ? 'checked' : ''}>
        ${name}
      </label>
    `).join('');

    if (fighters.length === 0) {
      fighterSelectionBox.innerHTML = `<p style="color: #888; margin: 0;">Nenhum lutador nesta faixa.</p>`;
    }
  }

  /**
   * Atualiza a caixa de "Participantes Selecionados" e o input escondido.
   */
  function updateSelectedFightersDisplay() {
    if (selectedFighters.length === 0) {
      selectedFightersPreview.textContent = "(Nenhum)";
    } else {
      selectedFightersPreview.textContent = selectedFighters.join(', ');
    }
    // Atualiza o campo do formulário que será salvo
    participantsClosedInput.value = selectedFighters.join(',');
  }


  // --- GRUPO 5: FUNÇÕES DE DADOS (LOCALSTORAGE) E RENDERIZAÇÃO ---

  /**
   * Deleta um card da tela e do localStorage.
   * @param {string} cardId - O ID do card a ser deletado.
   * @param {HTMLElement} cardElement - O elemento HTML do card.
   */
  function handleDeleteCard(cardId, cardElement) {
    cardElement.remove();
    let cards = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    cards = cards.filter(card => String(card.id) !== String(cardId));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    closeModal();
  }

  /**
   * Carrega todos os cards do localStorage e os renderiza na tela.
   */
  function loadCards() {
    const cards = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const originalCards = Array.from(grid.querySelectorAll('.card'));
    
    cards.forEach(cardData => {
      // Evita duplicar cards se o ID já existir (embora não deva acontecer com IDs únicos)
      const exists = originalCards.some(c => c.dataset.id === String(cardData.id));
      if (!exists) {
        renderCard(cardData);
      }
    });
  }

  /**
   * Salva um novo objeto de card no localStorage.
   * @param {object} cardData - O objeto com os dados do novo card.
   */
  function saveCard(cardData) {
    const cards = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    cards.push(cardData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }

  /**
   * Cria o elemento HTML de um card e o adiciona ao grid.
   * @param {object} cardData - O objeto com os dados do card.
   */
  function renderCard(cardData) {
    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;
    card.role = "button";

    // Adiciona os dados como 'dataset'
    card.dataset.id = cardData.id;
    card.dataset.title = cardData.title;
    card.dataset.location = cardData.location;
    card.dataset.desc = cardData.desc;
    card.dataset.extra = cardData.extra;
    card.dataset.pill1 = cardData.pill1;
    card.dataset.pill2 = cardData.pill2;
    card.dataset.participantes = cardData.participantes;
    card.dataset.premiacao = cardData.premiacao;
    card.dataset.eventType = cardData.eventType;

    // Cria o HTML interno do card
    card.innerHTML = `
      <div class="title">${cardData.title}</div>
      <div class="loc">${cardData.location}</div>
      <div class="meta">
        ${cardData.pill1 ? `<div class="pill">${cardData.pill1}</div>` : ''}
        ${cardData.pill2 ? `<div class="pill">${cardData.pill2}</div>` : ''}
      </div>
    `;
    grid.appendChild(card);
  }

  /**
   * Manipulador do evento 'submit' do formulário de criação.
   * Lê os dados, salva e renderiza o novo card.
   * @param {Event} event - O evento de submit.
   */
  function handleSaveCard(event) {
    event.preventDefault();
    const formData = new FormData(createForm);
    const eventType = formData.get("eventType");

    // Pega os participantes corretos com base no tipo de evento
    const participantes = (eventType === 'open') 
      ? formData.get("participantes_open") 
      : formData.get("participantes_closed");

    const newCardData = {
      id: Date.now(),
      title: formData.get("title"),
      location: formData.get("location"),
      desc: formData.get("desc"),
      extra: formData.get("extra"),
      pill1: formData.get("pill1"),
      pill2: formData.get("pill2"),
      premiacao: formData.get("premiacao"),
      eventType: eventType,
      participantes: participantes,
    };

    saveCard(newCardData);
    renderCard(newCardData);
    closeCreateModal();
  }


  // --- GRUPO 6: INICIALIZAÇÃO E "ESCUTADORES" DE EVENTOS ---

  // O DOMContentLoaded é movido para o wrapper externo
  
  // Carrega os cards salvos
  loadCards();

  // Escutador do MODAL DE DISPLAY
  // Verifica se os elementos existem antes de adicionar escutadores
  if (displayModal) {
    closeBtn.addEventListener("click", closeModal);
    displayModal.addEventListener("click", (e) => {
      if (e.target === displayModal) closeModal();
    });
  }

  // Escutador DELEGADO para os CARDS (pega cliques em cards novos e antigos)
  if (grid) {
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      if (card) {
        openModalFromCard(card);
      }
    });
    grid.addEventListener("keydown", (e) => {
      const card = e.target.closest(".card");
      if (card && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        openModalFromCard(card);
      }
    });
  }

  // Escutadores do MODAL DE CRIAÇÃO
  if (createModal) {
    createBtn.addEventListener("click", openCreateModal);
    createModalCloseBtn.addEventListener("click", closeCreateModal);
    createModal.addEventListener("click", (e) => {
      if (e.target === createModal) closeCreateModal();
    });

    // Navegação do modal de criação
    nextBtn.addEventListener("click", goToCreatePage2);
    backBtn.addEventListener("click", goToCreatePage1);

    // Validação em tempo real
    newTitleInput.addEventListener("input", validateStep1);
    newDescInput.addEventListener("input", validateStep1);

    // Salvar (escuta o 'submit' do formulário)
    createForm.addEventListener("submit", handleSaveCard);
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      createForm.requestSubmit(); // Dispara o 'submit' do formulário
    });

    // Escutadores do Seletor de Participantes
    eventTypeSelect.addEventListener('change', updateParticipantUI);
    beltTabsContainer.addEventListener('click', (e) => {
      const tab = e.target.closest('.belt-tab');
      if (tab) {
        renderFighterList(tab.dataset.belt);
      }
    });
    fighterSelectionBox.addEventListener('change', (e) => {
      const checkbox = e.target;
      const name = checkbox.dataset.name;
      if (checkbox.checked) {
        if (!selectedFighters.includes(name)) {
          selectedFighters.push(name);
        }
      } else {
        selectedFighters = selectedFighters.filter(fname => fname !== name);
      }
      updateSelectedFightersDisplay();
    });
    
    // Inicialização da UI de criação
    updateParticipantUI(); // Define o estado inicial (Aberto)
    renderFighterList('branca'); // Pré-carrega a primeira lista
  }

  // Escutador global de 'Escape'
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (displayModal && displayModal.style.display === "flex") {
        closeModal();
      }
      if (createModal && createModal.style.display === "flex") {
        closeCreateModal();
      }
    }
  });
  
  // Adiciona verificações de segurança para garantir que os elementos existem
  // Isso evita que o script quebre se for importado em uma página que não
  // tem os elementos (como 'calendario.html')
  if (grid && createModal) {
      // A lógica principal só deve rodar se os elementos principais existirem
  } else {
      // console.log("Script 'script.js' carregado, mas elementos principais (grid ou createModal) não encontrados. Pulando inicialização dos cards.");
  }

});