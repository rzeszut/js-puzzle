var Puzzle = (function() {
    function initializeSetting(to, from, name, def) {
        to[name] = from[name] || def;
    }

    function validateSetting(config, name) {
        var value = config[name];
        if (value === null || value === undefined) {
            throw new Error("Invalid value for " + name);
        }
    }

    function initializeConfig(cfg) {
        var config = cfg || {};

        // initialize values
        initializeSetting(config, cfg, 'puzzleDifficulty', 4);
        initializeSetting(config, cfg, 'puzzleCanvasId', null);
        initializeSetting(config, cfg, 'imageSrc', null);
        initializeSetting(config, cfg, 'puzzleHoverTint', '#880000');
        initializeSetting(config, cfg, 'onWin', null);
        initializeSetting(config, cfg, 'animate', false);

        initializeSetting(config, cfg, 'showPuzzleStartText', false);
        initializeSetting(config, cfg, 'puzzleStartText', 'Click to start the puzzle');
        initializeSetting(config, cfg, 'puzzleStartTextFont', '20px Arial');
        initializeSetting(config, cfg, 'puzzleStartTextColor', '#ffffff');

        // validate values
        validateSetting(config, 'puzzleCanvasId');
        validateSetting(config, 'imageSrc');

        return config;
    }

    function Piece(cfg) {
        var config = cfg || {};

        this.clipX = config.clipX || 0;
        this.clipY = config.clipY || 0;
        this.clipWidth = config.clipWidth || 0;
        this.clipHeight = config.clipHeight || 0;

        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 0;
        this.height = config.height || 0;

        this.originalIndex = config.originalIndex || 0;
        this.currentIndex = config.currentIndex || 0;
    }

    /** Draws single piece in its position */
    Piece.prototype.draw = function (context, image) {
        context.drawImage(image,
                          this.clipX, this.clipY, this.clipWidth, this.clipHeight,
                          this.x, this.y, this.width, this.height);
        context.strokeRect(this.x, this.y, this.width, this.height);
    };

    /** Draws single piece in position passed as argument */
    Piece.prototype.drawInPosition = function (context, image, x, y) {
        context.drawImage(image,
                          this.clipX, this.clipY, this.clipWidth, this.clipHeight,
                          x, y, this.width, this.height);
        context.strokeRect(x, y, this.width, this.height);
    };

    /** Draws picked up piece, taking into account mouse position */
    Piece.prototype.drawPickedUp = function (context, image, mouse) {
        var w = this.width, h = this.height;

        context.save();
        context.globalAlpha = .6;
        context.drawImage(image,
                          this.clipX, this.clipY, this.clipWidth, this.clipHeight,
                          mouse.x - (w/2), mouse.y - (h/2), w, h);
        context.restore();
        context.strokeRect(mouse.x - (w/2), mouse.y - (h/2), w, h);
    };

    /** draws tint on the piece's area */
    Piece.prototype.drawTint = function (context, tint) {
        context.save();
        context.globalAlpha = .4;
        context.fillStyle = tint;
        context.fillRect(this.x, this.y, this.width, this.height);
        context.restore();
    };

    /** clears the piece's area */
    Piece.prototype.clearDraw = function (context) {
        context.clearRect(this.x, this.y, this.width, this.height);
    };

    Piece.prototype.update = function (cfg) {
        var config = cfg || {};

        for (var prop in config) {
            if (config.hasOwnProperty(prop)) {
                this[prop] = config[prop];
            }
        }
    };

    /** Class representing the puzzle */
    function Puzzle(cfg) {
        // puzzle configuration
        this.config = initializeConfig(cfg);

        // references to canvas and drawing context
        this.canvas = null;
        this.context = null;

        // reference to image
        this.image = null;

        // a list of pieces
        this.pieces = [];

        // dimensions of the puzzle
        this.puzzleWidth = 0,
        this.puzzleHeight = 0;

        // current dimensions of the display
        this.displayWidth = 0;
        this.displayHeight = 0;

        // reference for current picked up piece
        this.pickedPiece = null;
        // reference for piece below currently picked up piece
        this.dropTargetPiece = null;

        // timer
        this.timer = new StopWatch();

        // flag indicating whether puzzle is being solved
        this.started = false;
    }

    /**
     * Initializer method.
     * Gets image, sets up canvas and drawing context,
     * calculates dimensions, etc.
     * Doesn't draw anythig.
     */
    Puzzle.prototype.initialize = function (fn) {
        var self = this;

        var afterImageInitialization = function () {
            initializePuzzlePieces(self);
            initializeCanvas(self);

            // call passed function
            fn();
        };

        // `initialize` may be called after image is already loaded,
        // to relalculate pieces after changing difficulty
        if (self.image == null) {
            self.image = new Image();
            self.image.addEventListener('load', afterImageInitialization, false);
            self.image.src = self.config.imageSrc;
        } else {
            afterImageInitialization();
        }
    };

    /** Initializes canvas and drawing context */
    function initializeCanvas(self) {
        self.canvas = document.getElementById('puzzle-canvas');
        self.context = self.canvas.getContext('2d');

        self.displayWidth = self.canvas.width;
        self.displayHeight = self.canvas.height;
    };

    /** Initializes pieces array */
    function initializePuzzlePieces(self) {
        var diff = self.config.puzzleDifficulty,
            pieceWidth = Math.floor(self.image.width / diff),
            pieceHeight = Math.floor(self.image.height / diff);

        // save puzzle dimensions
        self.puzzleWidth = pieceWidth * diff;
        self.puzzleHeight = pieceHeight * diff;

        // generate puzzle array
        var piece, i, x = 0, y = 0,
            size = diff * diff;

        self.pieces = [];
        for (i = 0; i < size; ++i) {
            piece = new Piece({
                clipX: x, clipY: y,
                clipWidth: pieceWidth, clipHeight: pieceHeight,
                originalIndex: i
            });
            self.pieces.push(piece);

            // move to the next piece's coords
            x += pieceWidth;
            if (x >= self.puzzleWidth) {
                x = 0;
                y += pieceHeight;
            }
        }
    };

    /**
     * Sets new difficulty level.
     * Call `initialize` after this function.
     */
    Puzzle.prototype.setDifficulty = function (diff) {
        this.config.puzzleDifficulty = parseInt(diff, 10);
        return this;
    }

    Puzzle.prototype.getDifficulty = function () {
        return this.config.puzzleDifficulty;
    }

    Puzzle.prototype.drawCompleteImage = function () {
        this.context.drawImage(this.image,
                               0, 0, this.puzzleWidth, this.puzzleHeight,
                               0, 0, this.displayWidth, this.displayHeight);
    }

    /**
     * Starts the puzzle.
     * Draws the image, starting title, and sets up the listeners.
     * @param showStartingScreen optional boolean flag, whether to show
     *  starting screen or not; defaults to true
     */
    Puzzle.prototype.start = function (showStartingScreen) {
        // default showStartingScreen to true
        showStartingScreen === undefined && (showStartingScreen = true);

        var self = this,
            run = function () {
                shufflePiecesAndRun(self);
            };

        if (showStartingScreen) {
            drawStartingScreen(self);

            self.started = false;
            self.canvas.onmousedown = run;
        } else {
            run();
        }
    };

    function drawStartingScreen (self) {
        self.drawCompleteImage();

        if (self.config.showPuzzleStartText) {
            drawStartingTitle(self);
        }
    }

    /** Draws starting text */
    function drawStartingTitle(self) {
        self.context.save();
        self.context.globalAlpha = .4;
        self.context.fillRect(0, 0, self.displayWidth, self.displayHeight);
        self.context.restore();

        self.context.save();
        self.context.textAlign = 'center';
        self.context.textBaseline = 'middle';
        self.context.fillStyle = self.config.puzzleStartTextColor;
        self.context.font = self.config.puzzleStartTextFont;
        self.context.fillText(self.config.puzzleStartText,
                              self.displayWidth / 2, self.displayHeight / 2);
        self.context.restore();
    };

    /** Shuffle puzzle and run the game */
    function shufflePiecesAndRun(self) {
        var pickUpPieceCallback = function () {
            self.timer.start();
            self.started = true;

            // set up next click listener -- pick up piece
            self.canvas.onmousedown = function (event) {
                var mouse = getMousePosition(event, self.canvas);

                self.pickedPiece = getClickedPuzzle(self.pieces, mouse);
                if (self.pickedPiece !== null) {
                    self.pickedPiece.clearDraw(self.context);
                    self.pickedPiece.drawPickedUp(self.context, self.image, mouse);

                    // set up next callbacks
                    self.canvas.onmousemove = updatePuzzle;
                    self.canvas.onmouseup = dropPiece;
                }
            };
        };

        /** Draw puzzle while user moves the picked up piece */
        var updatePuzzle = function (event) {
            var piece, i,
                mouse = getMousePosition(event, self.canvas);

            clearDisplay(self);

            self.dropTargetPiece = null;
            for (i = 0; i < self.pieces.length; ++i) {
                piece = self.pieces[i];

                // skip currently picked up piece for now --
                // it must be drawn over everythig else
                if (piece == self.pickedPiece) {
                    continue;
                }

                piece.draw(self.context, self.image);
                determineTargetPieceAndDrawTint(self, piece, mouse);
            }

            self.pickedPiece.drawPickedUp(self.context, self.image, mouse);
        }

        var dropPiece = function () {
            // remove unwanted listeners
            self.canvas.onmousemove = null;
            self.canvas.onmouseup = null;

            // drop piece -- swap picked up piece and drop target position
            if (self.dropTargetPiece !== null) {
                swapPieces(self.pickedPiece, self.dropTargetPiece);
            }

            redrawPuzzle(self);
            checkWinCondition(self);
        };

        self.pieces.shuffle();
        computePiecesScreenCoords(self);

        if (self.config.animate) {
            animateFallingPieces(self, pickUpPieceCallback);
        } else {
            pickUpPieceCallback();
        }
    };

    function computePiecesScreenCoords(self) {
        var diff = self.config.puzzleDifficulty,
            pieceWidth = self.displayWidth / diff,
            pieceHeight = self.displayHeight / diff;

        var x = 0; y = 0;
        self.pieces.forEach(function (piece, i) {
            piece.update({
                x: x, y: y,
                width: pieceWidth, height: pieceHeight,
                currentIndex: i
            });

            piece.draw(self.context, self.image);

            // move to the next piece's coords
            x += pieceWidth;
            if (x >= self.displayWidth) {
                x = 0;
                y += pieceHeight;
            }
        });
    };

    function animateFallingPieces(self, fn) {
        var timer = new StopWatch(),
            currentPieceIndex = 0,
            goToNextPiece = false,
            pieceHeight = self.pieces[currentPieceIndex].height;

        var animate = function () {
            // if one piece was animated, go to the next
            if (goToNextPiece) {
                // start new time count for new piece
                timer.start();
                goToNextPiece = false;
                ++currentPieceIndex;
            }

            // stop animation when all pieces are in their places
            if (currentPieceIndex >= self.pieces.length) {
                // call passed function after animation ends
                fn();
                return;
            }

            // measure animation progress
            timer.stop();
            var progress = timer.getTime() / 200,
                currentPiece = self.pieces[currentPieceIndex],
                y = progress * (currentPiece.y + pieceHeight) - pieceHeight;

            // if finished animation for this piece, mark the flag
            if (progress >= 1) {
                progress = 1;
                goToNextPiece = true;
            }

            clearDisplay(self);

            // draw pieces that have fallen in their places
            for (var i = 0; i < currentPieceIndex; ++i) {
                self.pieces[i].draw(self.context, self.image);
            }

            // draw currently falling piece in its position
            currentPiece.drawInPosition(self.context, self.image,
                                       currentPiece.x, y);

            // next frame
            requestAnimationFrame(animate);
        };

        timer.start();
        requestAnimationFrame(animate);
    }

    function clearDisplay(self) {
        self.context.clearRect(0, 0, self.displayWidth, self.displayHeight);
    }

    /** Returns puzzle clicked by user */
    function getClickedPuzzle(pieces, mouse) {
        var i, piece;

        for (i = 0; i < pieces.length; ++i) {
            piece = pieces[i];

            if (isPieceHit(piece, mouse)) {
                return piece;
            }
        }
        return null;
    };

    /** Checks whether the piece was hit by a click */
    function isPieceHit(piece, mouse) {
        var mx = mouse.x, my = mouse.y,
            x = piece.x, y = piece.y;

        return mx >= x && mx <= (x + piece.width) &&
               my >= y && my <= (y + piece.height);
    }

    function determineTargetPieceAndDrawTint(self, piece, mouse) {
        // if there is no targeted piece and mouse is over current piece
        if (self.dropTargetPiece == null && isPieceHit(piece, mouse)) {
            self.dropTargetPiece = piece;
            self.dropTargetPiece.drawTint(self.context,
                                          self.config.puzzleHoverTint);
        }
    }

    /** Redraws all pieces of the puzzle */
    function redrawPuzzle(self) {
        clearDisplay(self);
        for (var i = 0; i < self.pieces.length; ++i) {
            self.pieces[i].draw(self.context, self.image);
        }
    }

    /** Swaps x, y of passed pieces */
    function swapPieces(piece1, piece2) {
        var tmp = {
            x: piece1.x,
            y: piece1.y,
            currentIndex: piece1.currentIndex
        };

        piece1.update({
            x: piece2.x,
            y: piece2.y,
            currentIndex: piece2.currentIndex
        });
        piece2.update(tmp);
    }

    /** When the puzzle is completed, calls 'onWon' callback passed in config */
    function checkWinCondition(self) {
        var isWon = determineWinCondition(self.pieces);

        if (isWon) {
            self.timer.stop();
            self.canvas.onmousedown = null;

            callUserWinCallback(self);
        }
    }

    function determineWinCondition (pieces) {
        return pieces.every(function (piece) {
            return piece.originalIndex === piece.currentIndex;
        });
    }

    function callUserWinCallback(self) {
        var onWin = self.config.onWin;
        if (onWin) {
            setTimeout(function () {
                onWin(self.timer.getTime());
            }, 300);
        }
    }

    /**
     * Call this function after canvas resizes --
     * it will recalculate pieces' positions and sizes.
     */
    Puzzle.prototype.recalculateAfterResize = function () {
        var self = this,
            diff = self.config.puzzleDifficulty,
            newDisplayWidth = self.canvas.width,
            newDisplayHeight = self.canvas.height;
            pieceWidth = newDisplayWidth / diff,
            pieceHeight = newDisplayHeight / diff;

        self.pieces.forEach(function (piece) {
            var newX = (piece.x * newDisplayWidth) / self.displayWidth,
                newY = (piece.y * newDisplayHeight) / self.displayHeight;

            piece.update({
                x: newX, y: newY,
                width: pieceWidth, height: pieceHeight
            });
        });

        self.displayWidth = newDisplayWidth;
        self.displayHeight = newDisplayHeight;

        if (self.started) {
            redrawPuzzle(self);
        } else {
            drawStartingScreen(self);
        }
    };

    return Puzzle;
})();

