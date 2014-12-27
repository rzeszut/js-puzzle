var puzzle;

function resizeCanvas() {
    var puzzleArea = document.getElementById('puzzle-area'),
        puzzleCanvas = document.getElementById('puzzle-canvas'),

        oldWidthToHeight = 4/3;
        newWidth = window.innerWidth,
        newHeight = window.innerHeight,
        newWidthToHeight = newWidth / newHeight;

    if (newWidthToHeight > oldWidthToHeight) {
        newWidth = newHeight * oldWidthToHeight;
    } else {
        newHeight = newWidth / oldWidthToHeight;
    }

    puzzleArea.style.width = newWidth + 'px';
    puzzleArea.style.height = newHeight + 'px';

    puzzleArea.style.marginTop = (-newHeight / 2) + 'px';
    puzzleArea.style.marginLeft = (-newWidth / 2) + 'px';

    puzzleCanvas.width = 0.8 * newWidth;
    puzzleCanvas.height = 0.8 * newHeight;
}

function bindSliderChanges() {
    var slider = document.getElementById('puzzle-difficulty'),
        text = document.getElementById('puzzle-difficulty-text');

    slider.onchange = function () {
        text.value = slider.value;
    };
}

function bindButtonClick() {
    var slider = document.getElementById('puzzle-difficulty'),
        button = document.getElementById('puzzle-shuffle');

    button.onclick = function () {
        var difficulty = slider.value;

        puzzle.setDifficulty(difficulty);
        puzzle.initialize(function () {
            puzzle.start(false);
        });
    };
}

function bindDialogClick() {
    var overlay = document.getElementById('overlay'),
        scoreBox = document.getElementById('puzzle-score');

    scoreBox.onclick = function () {
        overlay.style.visibility = "hidden";
    }
}

function bindResizeEvent() {
    window.addEventListener('resize', function () {
        resizeCanvas();
        puzzle.recalculateAfterResize();
    }, false);
}

function getScore() {
    var scoreStr = localStorage.getItem('score'),
        score = [];

    if (scoreStr) {
        score = JSON.parse(scoreStr);
    }

    return score;
}

function saveScore(time) {
    var score = getScore();

    score.push({
        difficulty: puzzle.getDifficulty(),
        time: time
    });
    localStorage.setItem('score', JSON.stringify(score));
}

function removeAllChildren(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function getScoreForCurrentDifficulty() {
    var difficulty = puzzle.getDifficulty();

    return getScore().filter(function (s) {
        return s.difficulty === difficulty;
    }).sort(function (s1, s2) {
        return s1.time - s2.time;
    }).slice(0, 10);
}

function showScore() {
    var overlay = document.getElementById('overlay'),
        scoreBox = document.getElementById('puzzle-score'),
        scoreList = document.getElementById('puzzle-score-list'),
        score = getScoreForCurrentDifficulty();

    removeAllChildren(scoreList);

    score.forEach(function (s) {
        var el = document.createElement('li');
        el.innerHTML = (s.time / 1000) + 's';
        scoreList.appendChild(el);
    });

    overlay.style.visibility = "visible";
}

function createPuzzle() {
    var onWin = function (time) {
        saveScore(time);
        showScore();

        puzzle.start();
    };

    return new Puzzle({
        puzzleDifficulty: 4,
        puzzleCanvasId: 'puzzle-canvas',
        imageSrc: 'img/puzzle.jpg',
        onWin: onWin,
        showPuzzleStartText: true,
        animate: true
    });
}

function initialize() {
    puzzle = createPuzzle();

    // initialize canvas
    resizeCanvas();

    // add event listeners
    bindResizeEvent();
    bindSliderChanges();
    bindButtonClick();
    bindDialogClick();

    puzzle.initialize(function () {
        puzzle.start();
    });
}
