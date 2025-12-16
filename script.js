// State System
const state = {
    timeMode: 'past', // 'past', 'now', 'final'
    experienceState: 'idle', // 'idle', 'card_ready', 'in_memory', 'final'
    insertedCard: null, // 'voice', 'space', 'time'

    // Object states: 'locked', 'blurry_collected', 'clarified_submitted'
    objects: {
        page: 'locked',
        bag: 'locked',
        watch: 'locked'
    },

    currentMemoryStep: 0,
    currentMemory: null,
    screenRect: null // Stored screen bounding box for portal animation
};

// Card to Object mapping
const cardToObject = {
    voice: 'page',
    space: 'bag',
    time: 'watch'
};

// DOM Elements - Device UI
const body = document.body;
const screen = document.getElementById('screen');
const dialogueText = document.getElementById('dialogue-text');
const btnEnter = document.getElementById('btn-enter');
const cardSlot = document.getElementById('card-slot');
const slotIndicator = document.getElementById('slot-indicator');
const cards = document.querySelectorAll('.card');

// DOM Elements - Memory Overlay (Portal)
const memoryOverlay = document.getElementById('memoryOverlay');
const portalClip = document.getElementById('portalClip');
const memoryScene = document.getElementById('memoryScene');
const memoryDialogueText = document.getElementById('memoryDialogueText');
const memoryHint = document.getElementById('memoryHint');

// Inventory slots
const inventorySlots = {
    page: document.querySelector('[data-object="page"]'),
    bag: document.querySelector('[data-object="bag"]'),
    watch: document.querySelector('[data-object="watch"]')
};

// Memory Content (PAST)
const memories = {
    voice: [
        "I hear it again.",
        "The voice that made me small.",
        "Every word was a rule I couldn't understand.",
        "Every silence was a test I failed.",
        "I tried to make myself quieter.\nSmaller.\nGone.",
        "But I couldn't disappear completely.",
        "So I learned to write instead.",
        "Words I could control.\nWords that were mine."
    ],
    space: [
        "The room feels too big.",
        "And too small at the same time.",
        "Nowhere is safe.",
        "The door opens—or it doesn't.",
        "It doesn't matter.\nThe feeling is the same.",
        "I learned to pack everything that mattered\ninto something I could carry.",
        "A bag.\nAlways ready.",
        "Ready to leave.\nReady to stay invisible."
    ],
    time: [
        "Time moves strangely here.",
        "Some days last forever.",
        "Some moments vanish before I can hold them.",
        "I watch the clock.",
        "Counting minutes until it's over.",
        "Counting hours until it happens again.",
        "Time is not a line.\nIt's a spiral.",
        "Always circling back to the same place."
    ]
};

// NOW Mode - Default Text
const nowDefaultText = "I remember these things.\nBut remembering is not the same as understanding.";

// Clarification Dialogue (NOW mode)
const clarificationDialogue = {
    page: "I thought it was just words.\nBut I hear how they stayed with me.\n\nI name them now.\nThey no longer speak for me.",
    bag: "I carried this without knowing why.\n\nIt wasn't weight.\nIt was fear of being seen.\n\nI don't need to carry it like this anymore.",
    watch: "I waited for it to end.\n\nI didn't know I was already moving forward.\n\nTime didn't trap me.\nI survived it."
};

// Already clarified message
const alreadyClarifiedText = "I have already understood this.";

// Final Message
const finalMessage = "I can't change what happened.\n\nBut I can choose\nwhat it becomes inside me.";

// Initialize
function init() {
    setDialogue("...");
    updateInventoryUI();
    attachEventListeners();
    updateButtonState();
}

// Event Listeners
function attachEventListeners() {
    btnEnter.addEventListener('click', handleEnterButton);

    // Card interactions
    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('click', handleCardClick);
    });

    cardSlot.addEventListener('dragover', handleDragOver);
    cardSlot.addEventListener('drop', handleDrop);
    cardSlot.addEventListener('dragleave', handleDragLeave);
    cardSlot.addEventListener('click', handleSlotClick);
}

// Handle ENTER button
function handleEnterButton() {
    if (state.experienceState === 'final') return;

    if (state.timeMode === 'past') {
        handleEnterInPast();
    } else if (state.timeMode === 'now') {
        handleEnterInNow();
    }
}

// ENTER in PAST mode
function handleEnterInPast() {
    if (state.experienceState === 'card_ready' && state.insertedCard) {
        enterMemoryPortal();
    } else if (state.experienceState === 'in_memory') {
        progressMemory();
    }
}

// ========================================
// PORTAL EXPANSION - Enter Memory
// ========================================
function enterMemoryPortal() {
    state.experienceState = 'in_memory';
    state.currentMemory = memories[state.insertedCard];
    state.currentMemoryStep = 0;

    // Get screen bounding box
    const rect = screen.getBoundingClientRect();
    state.screenRect = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
    };

    // Set memory scene background
    memoryScene.className = '';
    memoryScene.classList.add(`memory-${state.insertedCard}`);

    // Set initial memory dialogue
    memoryDialogueText.textContent = state.currentMemory[0];

    // Show overlay
    memoryOverlay.classList.add('active');

    // Set portal clip to screen position (start state)
    portalClip.style.left = `${state.screenRect.left}px`;
    portalClip.style.top = `${state.screenRect.top}px`;
    portalClip.style.width = `${state.screenRect.width}px`;
    portalClip.style.height = `${state.screenRect.height}px`;

    // Force reflow
    portalClip.offsetHeight;

    // Next frame: expand to full viewport
    requestAnimationFrame(() => {
        portalClip.style.left = '0';
        portalClip.style.top = '0';
        portalClip.style.width = '100vw';
        portalClip.style.height = '100vh';

        // After expansion completes, mark as expanded
        setTimeout(() => {
            memoryOverlay.classList.add('portal-expanded');
        }, 800);
    });

    updateButtonState();
}

// Progress through memory steps
function progressMemory() {
    state.currentMemoryStep++;

    if (state.currentMemoryStep < state.currentMemory.length) {
        // Update memory dialogue
        memoryDialogueText.textContent = state.currentMemory[state.currentMemoryStep];
    } else {
        // Memory complete
        completeMemory();
    }
}

// Complete memory and obtain object (blurry)
function completeMemory() {
    const objectName = cardToObject[state.insertedCard];

    // Set object to blurry_collected
    state.objects[objectName] = 'blurry_collected';

    // Update inventory
    updateInventoryUI();

    // Show brief completion message
    memoryDialogueText.textContent = `[${objectName}]`;
    memoryHint.style.display = 'none';

    // Exit memory after delay
    setTimeout(() => {
        exitMemoryPortal();
    }, 2000);
}

// ========================================
// PORTAL CONTRACTION - Exit Memory
// ========================================
function exitMemoryPortal() {
    // Remove expanded class
    memoryOverlay.classList.remove('portal-expanded');

    // Contract portal back to screen rect
    portalClip.style.left = `${state.screenRect.left}px`;
    portalClip.style.top = `${state.screenRect.top}px`;
    portalClip.style.width = `${state.screenRect.width}px`;
    portalClip.style.height = `${state.screenRect.height}px`;

    // After contraction completes
    setTimeout(() => {
        // Hide overlay
        memoryOverlay.classList.remove('active');

        // Reset memory scene
        memoryScene.className = '';
        memoryHint.style.display = 'block';

        // Eject card
        ejectCard();

        // Check if all objects collected → transition to NOW
        if (allObjectsCollected()) {
            setTimeout(() => {
                transitionToNow();
            }, 1000);
        } else {
            setDialogue("...");
        }

        // Reset state
        state.experienceState = 'idle';
        state.currentMemory = null;
        state.currentMemoryStep = 0;
        updateButtonState();
    }, 800);
}

// Check if all objects collected (blurry or clarified)
function allObjectsCollected() {
    return state.objects.page !== 'locked' &&
           state.objects.bag !== 'locked' &&
           state.objects.watch !== 'locked';
}

// Check if all objects clarified
function allObjectsClarified() {
    return state.objects.page === 'clarified_submitted' &&
           state.objects.bag === 'clarified_submitted' &&
           state.objects.watch === 'clarified_submitted';
}

// Transition to NOW mode
function transitionToNow() {
    state.timeMode = 'now';
    body.classList.remove('time-past');
    body.classList.add('time-now');

    setDialogue(nowDefaultText);
    updateButtonState();
}

// ENTER in NOW mode
function handleEnterInNow() {
    if (state.experienceState === 'card_ready' && state.insertedCard) {
        clarifyObject();
    }
}

// Clarify object (NOW mode)
function clarifyObject() {
    const objectName = cardToObject[state.insertedCard];

    // Check object state
    if (state.objects[objectName] === 'clarified_submitted') {
        // Already clarified
        setDialogue(alreadyClarifiedText);
        return;
    }

    if (state.objects[objectName] === 'blurry_collected') {
        // Clarify and submit
        state.objects[objectName] = 'clarified_submitted';

        // Show clarification dialogue
        setDialogue(clarificationDialogue[objectName]);

        // Update inventory (remove blur)
        updateInventoryUI();

        // Auto-eject card after delay
        setTimeout(() => {
            ejectCard();

            // Check if all objects clarified → transition to FINAL
            if (allObjectsClarified()) {
                setTimeout(() => {
                    transitionToFinal();
                }, 1000);
            } else {
                setDialogue(nowDefaultText);
            }
        }, 3000);
    }
}

// Transition to FINAL state
function transitionToFinal() {
    state.timeMode = 'final';
    state.experienceState = 'final';

    body.classList.remove('time-now');
    body.classList.add('time-final');

    setDialogue(finalMessage);
    updateButtonState();
}

// Card drag handlers
function handleDragStart(e) {
    if (state.experienceState === 'in_memory' || state.experienceState === 'final') {
        e.preventDefault();
        return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.dataset.card);
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '';
}

function handleDragOver(e) {
    if (state.experienceState === 'in_memory' || state.experienceState === 'final') {
        return;
    }
    e.preventDefault();
    cardSlot.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    cardSlot.classList.remove('drag-over');
}

function handleDrop(e) {
    if (state.experienceState === 'in_memory' || state.experienceState === 'final') {
        return;
    }

    e.stopPropagation();
    e.preventDefault();
    cardSlot.classList.remove('drag-over');

    const cardType = e.dataTransfer.getData('text/html');
    insertCard(cardType);
}

// Card click (alternative to drag)
function handleCardClick(e) {
    if (state.experienceState === 'in_memory' || state.experienceState === 'final') {
        return;
    }

    if (state.insertedCard) {
        ejectCard();
        setTimeout(() => {
            insertCard(e.currentTarget.dataset.card);
        }, 300);
    } else {
        insertCard(e.currentTarget.dataset.card);
    }
}

// Slot click (eject card)
function handleSlotClick() {
    if (state.insertedCard && state.experienceState !== 'in_memory' && state.experienceState !== 'final') {
        ejectCard();
    }
}

// Insert card
function insertCard(cardType) {
    if (state.insertedCard) return;

    state.insertedCard = cardType;
    state.experienceState = 'card_ready';

    const cardElement = document.querySelector(`[data-card="${cardType}"]`);
    cardElement.classList.add('inserted');

    cardSlot.classList.add('has-card');
    slotIndicator.textContent = cardType.toUpperCase();

    if (state.timeMode === 'past') {
        setDialogue("The device hums softly.\n\nReady.");
    }

    updateButtonState();
}

// Eject card
function ejectCard() {
    if (!state.insertedCard) return;

    const cardElement = document.querySelector(`[data-card="${state.insertedCard}"]`);
    cardElement.classList.remove('inserted');

    state.insertedCard = null;
    state.experienceState = 'idle';

    cardSlot.classList.remove('has-card');
    slotIndicator.textContent = '';

    if (state.timeMode === 'now' && !allObjectsClarified()) {
        setDialogue(nowDefaultText);
    }

    updateButtonState();
}

// Update inventory UI
function updateInventoryUI() {
    Object.keys(state.objects).forEach(objectName => {
        const slot = inventorySlots[objectName];
        const icon = slot.querySelector('.object-icon');
        const objectState = state.objects[objectName];

        // Reset classes
        slot.classList.remove('locked');
        icon.classList.remove('has-object', 'blurry', 'clarified');

        if (objectState === 'locked') {
            slot.classList.add('locked');
        } else if (objectState === 'blurry_collected') {
            icon.classList.add('has-object', 'blurry');
        } else if (objectState === 'clarified_submitted') {
            icon.classList.add('has-object', 'clarified');
        }
    });
}

// Update button state
function updateButtonState() {
    if (state.experienceState === 'final') {
        btnEnter.disabled = true;
        btnEnter.classList.remove('active');
    } else if (state.experienceState === 'card_ready' || state.experienceState === 'in_memory') {
        btnEnter.disabled = false;
        btnEnter.classList.add('active');
    } else {
        btnEnter.disabled = true;
        btnEnter.classList.remove('active');
    }
}

// Set dialogue text (device screen)
function setDialogue(text) {
    dialogueText.textContent = text;
}

// Start the experience
init();
