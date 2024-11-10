document.addEventListener("DOMContentLoaded", function() {

    const puzzleSelector = document.getElementById("puzzle-selector");
    let puzzles = {}; // Store parsed puzzles here
    let correctGroups = [];   // Holds the groups of words for the selected puzzle
    let explanations = [];    // Holds explanations for each group
    let words = [];           // Flattened list of words for display in the grid
    
    fetch("puzzles.csv")
    .then(response => response.text())
    .then(data => {
        parseCSV(data); // Parse CSV data and populate puzzles
        populatePuzzleDropdown(); // Populate the dropdown with puzzle options
        const firstPuzzleNumber = Object.keys(puzzles)[0]; // Get the first puzzle's number
        if (firstPuzzleNumber) {
            loadPuzzle(firstPuzzleNumber); // Automatically load the first puzzle
            puzzleSelector.value = firstPuzzleNumber; // Set dropdown to the first puzzle
        }
    })
    .catch(error => console.error("Error loading puzzles:", error));

    // Parse CSV data into puzzles object
    function parseCSV(data) {
        const rows = data.trim().split("\n").slice(1); // Remove header row
        rows.forEach(row => {
            const [puzzle, group, word1, word2, word3, word4] = row.split(",");
            if (!puzzles[puzzle]) puzzles[puzzle] = []; // Initialize puzzle if not present
            puzzles[puzzle].push({
                group,
                words: [word1, word2, word3, word4]
            });
        });
    }

    function populatePuzzleDropdown() {
        puzzleSelector.innerHTML = ""; // Clear any existing options
    
        // Add options based on puzzles
        Object.keys(puzzles).forEach((puzzleNumber) => {
            const option = document.createElement("option");
            option.value = puzzleNumber;
            option.textContent = puzzleNumber;
            puzzleSelector.appendChild(option);
        });
    }
    
    puzzleSelector.addEventListener("change", () => {
        const selectedPuzzle = puzzleSelector.value;
        if (selectedPuzzle) {
            loadPuzzle(selectedPuzzle);
        }
    });

    const groupColorMap = {}; // Store pre-assigned colors for each group

    function loadPuzzle(puzzleNumber) {
        const puzzle = puzzles[puzzleNumber];
        if (!puzzle) return;
    
        // Reset color index and clear previous color assignments
        currentColorIndex = 0;
        Object.keys(groupColorMap).forEach(key => delete groupColorMap[key]);
    
        // Reset explanation container and displayed explanations
        explanationContainer.innerHTML = ""; // Clear previous explanations in the container
        displayedExplanations.length = 0; // Reset the displayed explanations array
    
        // Update `correctGroups` and `explanations` based on the selected puzzle
        correctGroups.length = 0; // Clear existing groups
        explanations.length = 0; // Clear existing explanations
        puzzle.forEach((group, index) => {
            correctGroups.push(group.words);
            explanations.push(group.group);
    
            // Pre-assign a color to each group and store it in `groupColorMap`
            const explanationText = `${group.group.toUpperCase()}: ${group.words.join(", ").toUpperCase()}`;
            if (!groupColorMap[explanationText]) {
                groupColorMap[explanationText] = groupColors[currentColorIndex];
                currentColorIndex = (currentColorIndex + 1) % groupColors.length; // Move to the next color
            }
        });
    
        // Flatten the `correctGroups` array to get all words and shuffle them
        words = correctGroups.flat();
        shuffleArray(words); // Shuffle words for display
    
        // Display words on the grid
        displayWords(words);
    
        // Reset game state
        identifiedGroupsCount = 0;
        selectedWords = [];
        attemptsLeft = 6;
        gameOver = false;
        feedback.textContent = "";
        updateAttemptsDisplay();
    
        // Disable the Solutions button at the start
        solutionButton.disabled = true;
        solutionButton.classList.add("disabled");
    }
    
    const groupColors = ['yellow', 'blue', 'red', 'purple'];
    let currentColorIndex = 0;

    let currentGroupIndex = 0;
    let identifiedGroupsCount = 0;
    let selectedWords = [];
    let attemptsLeft = 6;
    let gameOver = false;

    const wordContainer = document.getElementById("word-container");
    const feedback = document.getElementById("feedback");
    const explanationContainer = document.getElementById("explanation-container");
    const solutionButton = document.getElementById("solution-button");

    function toggleCheckButton() {
        const checkButton = document.getElementById("check-button");
        if (selectedWords.length === 4 && !gameOver) {
            checkButton.classList.add("visible");
            checkButton.classList.remove("hidden");
        } else {
            checkButton.classList.add("hidden");
            checkButton.classList.remove("visible");
        }
    }

    function selectWord(word, element) {
        if (gameOver) return;

        if (groupColors.some(color => element.classList.contains(color))) {
            return;
        }

        if (selectedWords.includes(word)) {
            selectedWords = selectedWords.filter(w => w !== word);
            element.classList.remove("selected");
        } else if (selectedWords.length < 4) {
            selectedWords.push(word);
            element.classList.add("selected");
        }

        toggleCheckButton();
    }

    const displayedExplanations = [];
  
    document.getElementById("check-button").addEventListener("click", () => {
        const feedback = document.getElementById("feedback");
    
        let bestMatchGroup = null;
        let maxMatches = 0;
        let matchedExplanation = "";
    
        correctGroups.forEach((group, index) => {
            const matchCount = selectedWords.filter(word => group.includes(word)).length;
            if (matchCount > maxMatches) {
                maxMatches = matchCount;
                bestMatchGroup = group;
                matchedExplanation = `${explanations[index].toUpperCase()}: ${group.join(", ").toUpperCase()}`;
            }
        });
    
        if (bestMatchGroup && maxMatches === 4) {
            feedback.textContent = "";
    
            // Use the pre-assigned color from groupColorMap
            const colorClass = groupColorMap[matchedExplanation];
    
            selectedWords.forEach(word => {
                const wordElement = Array.from(wordContainer.children).find(el => el.textContent === word);
                if (wordElement) {
                    wordElement.classList.add(colorClass);
                    wordElement.classList.remove("selected");
                }
            });
    
            const explanation = document.createElement("div");
            explanation.classList.add("explanation", colorClass);
            explanation.textContent = matchedExplanation;
            explanationContainer.appendChild(explanation);
    
            displayedExplanations.push(matchedExplanation);
            identifiedGroupsCount++;
            if (identifiedGroupsCount === 4) {
                feedback.textContent = "Goed gedaan! Je hebt de Precies Vier opgelost.";
            }
        } else {
            const incorrectCount = 4 - maxMatches;
            feedback.textContent = incorrectCount === 1 ? "Er klopt er eentje niet" : "Het klopt niet";
    
            attemptsLeft--;
            updateAttemptsDisplay();
    
            selectedWords.forEach(word => {
                const wordElement = Array.from(wordContainer.children).find(el => el.textContent === word);
                if (wordElement) {
                    wordElement.classList.remove("selected");
                }
            });
        }
    
        selectedWords.length = 0;
        toggleCheckButton();
    });

    function displayWords(words) {
        wordContainer.innerHTML = "";
        words.forEach(word => {
            const wordElement = document.createElement("div");
            wordElement.className = "word";
            wordElement.textContent = word;
            wordElement.addEventListener("click", () => selectWord(word, wordElement));
            wordContainer.appendChild(wordElement);
        });
    }

    displayWords(words);

    const attemptsContainer = document.getElementById("attempts");
    updateAttemptsDisplay();

    function updateAttemptsDisplay() {
        attemptsContainer.innerHTML = "";
        for (let i = 0; i < 6; i++) {
            const attemptRect = document.createElement("div");
            attemptRect.className = "attempt";
            if (i >= attemptsLeft) {
                attemptRect.classList.add("lost");
            }
            attemptsContainer.appendChild(attemptRect);
        }

        if (attemptsLeft === 0) {
            gameOver = true;
            feedback.textContent = "Game over!";
            toggleCheckButton();

            // Enable the Solutions button
            solutionButton.disabled = false;
            solutionButton.classList.remove("disabled");
        }
    }

    function shuffleArray(array) {
        const colorMap = {};
        Array.from(wordContainer.children).forEach(el => {
            const word = el.textContent;
            const colorClass = Array.from(el.classList).find(cls => groupColors.includes(cls));
            if (colorClass) {
                colorMap[word] = colorClass;
            }
        });

        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

        displayWords(array);

        Array.from(wordContainer.children).forEach(el => {
            const word = el.textContent;
            if (colorMap[word]) {
                el.classList.add(colorMap[word]);
            }
        });
    }

    solutionButton.addEventListener("click", () => {
        if (solutionButton.disabled) return;
    
        correctGroups.forEach((group, index) => {
            const explanationText = `${explanations[index].toUpperCase()}: ${group.join(", ").toUpperCase()}`;
            const colorClass = groupColorMap[explanationText]; // Use pre-assigned color
    
            group.forEach(word => {
                const wordElement = Array.from(wordContainer.children).find(el => el.textContent === word);
                if (wordElement) {
                    wordElement.classList.add(colorClass);
                }
            });
    
            if (!displayedExplanations.includes(explanationText)) {
                const explanation = document.createElement("div");
                explanation.classList.add("explanation", colorClass);
                explanation.textContent = explanationText;
                explanationContainer.appendChild(explanation);
                displayedExplanations.push(explanationText);
            }
        });
    });

    document.getElementById("shuffle-button").addEventListener("click", () => {
        shuffleArray(words);
    });

    document.getElementById("clear-selection-button").addEventListener("click", () => {
        selectedWords = [];
        document.querySelectorAll(".word.selected").forEach(wordElement => {
            wordElement.classList.remove("selected");
        });
        toggleCheckButton();
    });

});
