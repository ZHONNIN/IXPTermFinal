// State System
const state = {
    timeMode: 'present', // 'past' or 'present'
    insertedCard: null, // null, 'voice', 'space', 'time'
    memoryObjects: new Set(), // 'page', 'bag', 'watch'
    experienceState: 'idle', // 'idle', 'card_ready', 'in_memory', 'resolution', 'final'
    currentMemoryStep: 0,
    currentMemory: null,
    visitedMemories: new Set() // tracks which card+time combinations have been experienced
};

// DOM Elements
const device = document.getElementById('device');
const screen = document.getElementById('screen');
const screenText = document.getElementById('screen-text');
const screenContent = document.getElementById('screen-content');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const cardSlot = document.getElementById('card-slot');
const slotIndicator = document.getElementById('slot-indicator');
const cards = document.querySelectorAll('.card');
const cardsArea = document.getElementById('cards-area');

// Memory Content
const memories = {
    voice: {
        past: {
            steps: [
                "I hear it again.",
                "The voice that made me small.",
                "Every word was a rule I couldn't understand.",
                "Every silence was a test I failed.",
                "I tried to make myself quieter.\nSmaller.\nGone.",
                "But I couldn't disappear completely.",
                "So I learned to write instead.",
                "Words I could control.\nWords that were mine."
            ],
            object: 'page',
            objectImage: 'Object_Page.png'
        },
        present: {
            steps: [
                "I remember the voice now.",
                "Not the words anymore.",
                "Just the feeling of being small.",
                "I understand now:\nit wasn't about me.",
                "It was never about me.",
                "That voice was someone else's pain,\npassed down like a broken heirloom.",
                "I chose not to carry it further.",
                "I found my own voice instead."
            ],
            object: 'page',
            objectImage: 'Object_Page.png'
        }
    },
    space: {
        past: {
            steps: [
                "The room feels too big.",
                "And too small at the same time.",
                "Nowhere is safe.",
                "The door opens—or it doesn't.",
                "It doesn't matter.\nThe feeling is the same.",
                "I learned to pack everything\nthat mattered\ninto something I could carry.",
                "A bag.\nAlways ready.",
                "Ready to leave.\nReady to stay invisible."
            ],
            object: 'bag',
            objectImage: 'Object_Bag.png'
        },
        present: {
            steps: [
                "I still carry that bag sometimes.",
                "But now I know:\nI don't have to run.",
                "That room is far away now.",
                "I can visit it in memory,\nbut I don't live there anymore.",
                "I built my own space.",
                "A place where the door is mine.",
                "Where I decide who enters.",
                "Where I am not small."
            ],
            object: 'bag',
            objectImage: 'Object_Bag.png'
        }
    },
    time: {
        past: {
            steps: [
                "Time moves strangely here.",
                "Some days last forever.",
                "Some moments vanish before I can hold them.",
                "I watch the clock.",
                "Counting minutes until it's over.",
                "Counting hours until it happens again.",
                "Time is not a line.\nIt's a spiral.",
                "Always circling back\nto the same place."
            ],
            object: 'watch',
            objectImage: 'Object_Watch.png'
        },
        present: {
            steps: [
                "I still notice the time.",
                "But I don't count it the same way.",
                "The spiral broke.",
                "Time moves forward now.",
                "Not smoothly—\nnothing is ever smooth.",
                "But it moves.",
                "I am not trapped in that moment anymore.",
                "I carry it with me, but I am not made of it."
            ],
            object: 'watch',
            objectImage: 'Object_Watch.png'
        }
    }
};

// Resolution content (when all objects are collected)
const resolution = {
    steps: [
        "Three pieces.",
        "Voice. Space. Time.",
        "The fragments of who I was.",
        "I cannot change what happened.",
        "But I can choose what it becomes inside me.",
        "Not a wound that defines me.",
        "Not a story that ends me.",
        "A foundation.",
        "Something I built myself from."
    ]
};

// Final state
const finalMessage = "I understand now.\n\nI respect who I had to become.";

// Initialize
function init() {
    updateUI();
    attachEventListeners();
    setScreenText("...");
}

// Event Listeners
function attachEventListeners() {
    // Left button: switch time
    btnLeft.addEventListener('click', handleTimeSwitch);

    // Right button: activate memory
    btnRight.addEventListener('click', handleMemoryActivation);

    // Card drag and drop
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

// Handle time switch (left button)
function handleTimeSwitch() {
    if (state.experienceState === 'in_memory' || state.experienceState === 'final') {
        return; // Cannot switch time during memory or in final state
    }

    state.timeMode = state.timeMode === 'past' ? 'present' : 'past';
    updateUI();

    if (state.insertedCard) {
        setScreenText("The device hums softly.\n\nReady.");
    }
}

// Handle memory activation (right button)
function handleMemoryActivation() {
    if (state.experienceState === 'final') return;

    // Check if we should enter resolution
    if (state.memoryObjects.size === 3 && state.experienceState !== 'resolution') {
        enterResolution();
        return;
    }

    if (state.experienceState === 'resolution') {
        progressResolution();
        return;
    }

    if (state.experienceState === 'card_ready' && state.insertedCard) {
        enterMemory();
    } else if (state.experienceState === 'in_memory') {
        progressMemory();
    }
}

// Enter memory state
function enterMemory() {
    const memoryKey = `${state.insertedCard}_${state.timeMode}`;
    const memory = memories[state.insertedCard][state.timeMode];

    state.experienceState = 'in_memory';
    state.currentMemory = memory;
    state.currentMemoryStep = 0;
    screen.classList.add('memory-active');

    setScreenText(memory.steps[0]);
    updateUI();
}

// Progress through memory steps
function progressMemory() {
    state.currentMemoryStep++;
    const memory = state.currentMemory;

    if (state.currentMemoryStep < memory.steps.length) {
        setScreenText(memory.steps[state.currentMemoryStep]);
    } else {
        // Memory complete - give object
        completeMemory();
    }
}

// Complete memory and grant object
function completeMemory() {
    const memory = state.currentMemory;
    const objectName = memory.object;

    // Add object to collection
    state.memoryObjects.add(objectName);

    // Mark this memory as visited
    const memoryKey = `${state.insertedCard}_${state.timeMode}`;
    state.visitedMemories.add(memoryKey);

    // Show object
    showObject(memory.objectImage, objectName);

    // Return to ready state
    setTimeout(() => {
        screen.classList.remove('memory-active');
        screen.classList.remove('showing-object');

        // Check if all objects collected
        if (state.memoryObjects.size === 3) {
            state.experienceState = 'idle';
            ejectCard();
            setTimeout(() => {
                setScreenText("Something has changed.\n\n[Press ENTER]");
            }, 800);
        } else {
            state.experienceState = 'card_ready';
            setScreenText("You can remove the card now.");
        }
        updateUI();
    }, 3000);
}

// Show memory object
function showObject(imagePath, objectName) {
    screen.classList.add('showing-object');

    const objectImg = document.createElement('img');
    objectImg.src = imagePath;
    objectImg.className = 'memory-object';
    objectImg.alt = objectName;

    screenContent.innerHTML = '';
    screenContent.appendChild(objectImg);

    const obtainedText = document.createElement('p');
    obtainedText.id = 'screen-text';
    obtainedText.textContent = `[${objectName}]`;
    screenContent.appendChild(obtainedText);
}

// Enter resolution state
function enterResolution() {
    state.experienceState = 'resolution';
    state.currentMemoryStep = 0;
    screen.classList.add('memory-active');

    setScreenText(resolution.steps[0]);
    updateUI();
}

// Progress through resolution
function progressResolution() {
    state.currentMemoryStep++;

    if (state.currentMemoryStep < resolution.steps.length) {
        setScreenText(resolution.steps[state.currentMemoryStep]);
    } else {
        enterFinalState();
    }
}

// Enter final state
function enterFinalState() {
    state.experienceState = 'final';

    // Show all three objects together
    screenContent.innerHTML = '';

    const objectsContainer = document.createElement('div');
    objectsContainer.style.cssText = 'display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 20px;';

    ['Object_Page.png', 'Object_Bag.png', 'Object_Watch.png'].forEach(img => {
        const objImg = document.createElement('img');
        objImg.src = img;
        objImg.style.cssText = 'width: 80px; height: 80px; object-fit: contain; opacity: 0.6;';
        objectsContainer.appendChild(objImg);
    });

    screenContent.appendChild(objectsContainer);

    const finalText = document.createElement('p');
    finalText.id = 'screen-text';
    finalText.textContent = finalMessage;
    screenContent.appendChild(finalText);

    document.body.classList.add('final-state');
    updateUI();
}

// Card drag handlers
function handleDragStart(e) {
    if (state.experienceState === 'in_memory' || state.experienceState === 'resolution' || state.experienceState === 'final') {
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
    if (state.experienceState === 'in_memory' || state.experienceState === 'resolution' || state.experienceState === 'final') {
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
    if (state.experienceState === 'in_memory' || state.experienceState === 'resolution' || state.experienceState === 'final') {
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
    if (state.experienceState === 'in_memory' || state.experienceState === 'resolution' || state.experienceState === 'final') {
        return;
    }

    if (state.insertedCard) {
        // Eject current card first
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
    if (state.insertedCard && state.experienceState !== 'in_memory' && state.experienceState !== 'resolution') {
        ejectCard();
    }
}

// Insert card into slot
function insertCard(cardType) {
    if (state.insertedCard) return;

    state.insertedCard = cardType;
    state.experienceState = 'card_ready';
    state.currentMemoryStep = 0;

    const cardElement = document.querySelector(`[data-card="${cardType}"]`);
    cardElement.classList.add('inserted');

    setScreenText("The device hums softly.\n\nReady.");
    updateUI();
}

// Eject card from slot
function ejectCard() {
    if (!state.insertedCard) return;

    const cardElement = document.querySelector(`[data-card="${state.insertedCard}"]`);
    cardElement.classList.remove('inserted');

    state.insertedCard = null;
    state.experienceState = 'idle';
    state.currentMemory = null;
    state.currentMemoryStep = 0;
    screen.classList.remove('memory-active');

    setScreenText("...");
    updateUI();
}

// Update UI based on state
function updateUI() {
    // Update device appearance
    if (state.timeMode === 'past') {
        device.classList.add('past');
    } else {
        device.classList.remove('past');
    }

    // Update left button
    btnLeft.querySelector('.button-label').textContent = state.timeMode.toUpperCase();
    if (state.experienceState === 'in_memory' || state.experienceState === 'final') {
        btnLeft.disabled = true;
    } else {
        btnLeft.disabled = false;
    }

    // Update right button
    if (state.experienceState === 'final') {
        btnRight.disabled = true;
        btnRight.style.opacity = '0.2';
    } else if (state.experienceState === 'card_ready' || state.experienceState === 'in_memory' || state.experienceState === 'resolution') {
        btnRight.disabled = false;
        btnRight.style.opacity = '1';
        btnRight.classList.add('active');
    } else if (state.memoryObjects.size === 3 && state.experienceState === 'idle') {
        btnRight.disabled = false;
        btnRight.style.opacity = '1';
        btnRight.classList.add('active');
    } else {
        btnRight.disabled = true;
        btnRight.style.opacity = '0.5';
        btnRight.classList.remove('active');
    }

    // Update card slot
    if (state.insertedCard) {
        cardSlot.classList.add('has-card');
        slotIndicator.textContent = state.insertedCard.toUpperCase();
    } else {
        cardSlot.classList.remove('has-card');
        slotIndicator.textContent = '';
    }
}

// Set screen text
function setScreenText(text) {
    // Clear screen content
    screenContent.innerHTML = '';

    const textElement = document.createElement('p');
    textElement.id = 'screen-text';
    textElement.textContent = text;
    screenContent.appendChild(textElement);
}

// Start the experience
init();
