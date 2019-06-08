'use strict'

let ctx = null;

let gameTime = 0,
    lastFrameTime = 0;
let currentSecond = 0,
    frameCount = 0,
    framesLastSecond = 0;

let offsetX = 0,
    offsetY = 0;
let grid = [];

let mouseState = {
    x: 0,
    y: 0,
    click: null
};
let gameState = {
    difficulty: 'easy',
    screen: 'menu',
    newBest: false,
    timeTaken: 0,

    tileW: 20,
    tileH: 20
};
let difficulties = {
    easy: {
        name: "Easy",
        width: 10,
        height: 10,
        mines: 10,
        bestTime: 0,
        menuBox: [0, 0]
    },
    medium: {
        name: "Medium",
        width: 12,
        height: 12,
        mines: 20,
        bestTime: 0,
        menuBox: [0, 0]
    },
    hard: {
        name: "Hard",
        width: 15,
        height: 15,
        mines: 50,
        bestTime: 0,
        menuBox: [0, 0]
    }
};

function Tile(x, y) {
    this.x = x;
    this.y = y;
    this.hasMine = false;
    this.danger = 0;
    this.currentState = 'hidden';
}
Tile.prototype.calcDanger = function () {
    let cDiff = difficulties[gameState.difficulty];

    for (let py = this.y - 1; py <= this.y + 1; py++) {
        for (let px = this.x - 1; px <= this.x + 1; px++) {
            if (px == this.x && py == this.y) {
                continue;
            }

            if (px < 0 || py < 0 ||
                px >= cDiff.width ||
                py >= cDiff.height) {
                continue;
            }

            if (grid[((py * cDiff.width) + px)].hasMine) {
                this.danger++;
            }
        }
    }
};
Tile.prototype.flag = function () {
    if (this.currentState == 'hidden') {
        this.currentState = 'flagged';
    } else if (this.currentState == 'flagged') {
        this.currentState = 'hidden';
    }
};
Tile.prototype.click = function () {
    if (this.currentState != 'hidden') {
        return;
    }

    if (this.hasMine) {
        gameOver();
    } else if (this.danger > 0) {
        this.currentState = 'visible';
    } else {
        this.currentState = 'visible';
        this.revealNeighbours();
    }

    checkState();
};
Tile.prototype.doubleClick = function () {
    if (this.currentState != 'visible') {
        return;
    }
    let cDiff = difficulties[gameState.difficulty];
    let counter = 0;
    for (let py = this.y - 1; py <= this.y + 1; py++) {
        for (let px = this.x - 1; px <= this.x + 1; px++) {
            if (px == this.x && py == this.y) {
                continue;
            }

            if (px < 0 || py < 0 ||
                px >= cDiff.width ||
                py >= cDiff.height) {
                continue;
            }

            let idx = ((py * cDiff.width) + px);

            if (grid[idx].currentState == 'flagged') {
                counter += 1;
            }
        }
    }

    if (counter != this.danger) {
        //console.log(counter);
        return;
    }


    //console.log(counter);
    for (let py = this.y - 1; py <= this.y + 1; py++) {
        for (let px = this.x - 1; px <= this.x + 1; px++) {
            if (px == this.x && py == this.y) {
                continue;
            }

            if (px < 0 || py < 0 ||
                px >= cDiff.width ||
                py >= cDiff.height) {
                continue;
            }

            let idx = ((py * cDiff.width) + px);

            if (grid[idx].currentState != 'hidden') {
                continue;
            }

            grid[idx].click();
        }

    }

}
Tile.prototype.revealNeighbours = function () {
    let cDiff = difficulties[gameState.difficulty];

    for (let py = this.y - 1; py <= this.y + 1; py++) {
        for (let px = this.x - 1; px <= this.x + 1; px++) {
            if (px == this.x && py == this.y) {
                continue;
            }

            if (px < 0 || py < 0 ||
                px >= cDiff.width ||
                py >= cDiff.height) {
                continue;
            }

            let idx = ((py * cDiff.width) + px);

            if (grid[idx].currentState == 'hidden') {
                grid[idx].currentState = 'visible';

                if (grid[idx].danger == 0) {
                    grid[idx].revealNeighbours();
                }
            }
        }
    }
};

function checkState() {
    for (let i in grid) {
        if (grid[i].hasMine == false && grid[i].currentState != 'visible') {
            return;
        }
    }

    gameState.timeTaken = gameTime;
    let cDiff = difficulties[gameState.difficulty];

    if (cDiff.bestTime == 0 ||
        gameTime < cDiff.bestTime) {
        gameState.newBest = true;
        cDiff.bestTime = gameTime;
    }

    gameState.screen = 'won';
}

function gameOver() {
    gameState.screen = 'lost';
}

function startLevel(diff) {
    gameState.newBest = false;
    gameState.timeTaken = 0;
    gameState.difficulty = diff;
    gameState.screen = 'playing';

    gameTime = 0;
    lastFrameTime = 0;

    grid.length = 0;

    let cDiff = difficulties[diff];

    offsetX = Math.floor((document.getElementById('game').width -
        (cDiff.width * gameState.tileW)) / 2);

    offsetY = Math.floor((document.getElementById('game').height -
        (cDiff.height * gameState.tileH)) / 2);

    for (let py = 0; py < cDiff.height; py++) {
        for (let px = 0; px < cDiff.width; px++) {

            grid.push(new Tile(px, py));
        }
    }

    let minesPlaced = 0;

    while (minesPlaced < cDiff.mines) {
        let idx = Math.floor(Math.random() * grid.length);

        if (grid[idx].hasMine) {
            continue;
        }

        grid[idx].hasMine = true;
        minesPlaced++;
    }

    for (let i in grid) {
        grid[i].calcDanger();
    }
}

function updateGame() {
    if (gameState.screen == 'menu') {
        if (mouseState.click != null) {
            for (let i in difficulties) {
                if (mouseState.y >= difficulties[i].menuBox[0] &&
                    mouseState.y <= difficulties[i].menuBox[1]) {
                    startLevel(i);
                    break;
                }
            }
            mouseState.click = null;
        }
    } else if (gameState.screen == 'won' || gameState.screen == 'lost') {
        if (mouseState.click != null) {
            gameState.screen = 'menu';
            mouseState.click = null;
        }
    } else {
        if (mouseState.click != null) {
            let cDiff = difficulties[gameState.difficulty];

            if (mouseState.click[0] >= offsetX &&
                mouseState.click[1] >= offsetY &&
                mouseState.click[0] < (offsetX + (cDiff.width * gameState.tileW)) &&
                mouseState.click[1] < (offsetY + (cDiff.height * gameState.tileH))) {
                let tile = [
                    Math.floor((mouseState.click[0] - offsetX) / gameState.tileW),
                    Math.floor((mouseState.click[1] - offsetY) / gameState.tileH)
                ];

                if (mouseState.click[2] == 1) {
                    grid[((tile[1] * cDiff.width) + tile[0])].click();
                } else if (mouseState.click[2] == 2) {
                    grid[((tile[1] * cDiff.width) + tile[0])].flag();
                } else {
                    grid[((tile[1] * cDiff.width) + tile[0])].doubleClick();
                }
            } else if (mouseState.click[1] >= 380) {
                gameState.screen = 'menu';
            }

            mouseState.click = null;
        }
    }
}

window.onload = function () {
    ctx = document.getElementById('game').getContext('2d');

    // Event listeners

    document.getElementById('game').addEventListener('click', (e) => {
        let pos = realPos(e.pageX, e.pageY);
        mouseState.click = [pos[0], pos[1], 1];
    });
    document.getElementById('game').addEventListener('mousemove',
        (e) => {
            let pos = realPos(e.pageX, e.pageY);
            mouseState.x = pos[0];
            mouseState.y = pos[1];
        });
    document.getElementById('game').addEventListener('dblclick', (e) => {
        let pos = realPos(e.pageX, e.pageY);
        mouseState.click = [pos[0], pos[1], 3];
    });
    document.getElementById('game').addEventListener('contextmenu',
        (e) => {
            e.preventDefault();
            let pos = realPos(e.pageX, e.pageY);
            mouseState.click = [pos[0], pos[1], 2];
            return false;
        });

    requestAnimationFrame(drawGame);
};

function drawMenu() {
    ctx.textAlign = 'center';
    ctx.font = "bold 20pt sans-serif";
    ctx.fillStyle = "#000000";
    let y;
    y = 100;

    for (let d in difficulties) {
        let mouseOver = (mouseState.y >= (y - 20) && mouseState.y <= (y + 10));

        if (mouseOver) {
            ctx.fillStyle = "#000099";
        }

        difficulties[d].menuBox = [y - 20, y + 10];
        ctx.fillText(difficulties[d].name, 150, y);
        y += 80;

        if (mouseOver) {
            ctx.fillStyle = "#000000";
        }
    }

    y = 120;
    ctx.font = "italic 12pt sans-serif";

    for (let d in difficulties) {
        if (difficulties[d].bestTime == 0) {
            ctx.fillText("No best time", 150, y);
        } else {
            let t = difficulties[d].bestTime;
            let bestTime = "";
            if ((t / 1000) >= 60) {
                bestTime = Math.floor((t / 1000) / 60) + ":";
                t = t % (60000);
            }
            bestTime += Math.floor(t / 1000) +
                "." + (t % 1000);
            ctx.fillText("Best time   " + bestTime, 150, y);
        }
        y += 80;
    }
}

function drawPlaying() {
    let halfW = gameState.tileW / 2;
    let halfH = gameState.tileH / 2;

    let cDiff = difficulties[gameState.difficulty];

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    ctx.fillStyle = "#000000";
    ctx.font = "12px sans-serif";
    ctx.fillText(cDiff.name, 150, 20);

    ctx.fillText("Return to menu", 150, 390);

    if (gameState.screen != 'lost') {
        ctx.textAlign = "left";
        ctx.fillText("Mines: " + cDiff.mines, 10, 40);

        let whichT = (gameState.screen == 'won' ?
            gameState.timeTaken : gameTime);
        let t = '';
        if ((gameTime / 1000) > 60) {
            t = Math.floor((whichT / 1000) / 60) + ':';
        }
        let s = Math.floor((whichT / 1000) % 60);
        t += (s > 9 ? s : '0' + s);

        ctx.textAlign = "right";
        ctx.fillText("Time: " + t, 290, 40);
    }

    if (gameState.screen == 'lost' || gameState.screen == 'won') {
        ctx.textAlign = "center";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(
            (gameState.screen == 'lost' ?
                "Game Over" : "Cleared!"), 150, offsetY - 15);
    }

    ctx.strokeStyle = "#999999";
    ctx.strokeRect(offsetX, offsetY,
        (cDiff.width * gameState.tileW),
        (cDiff.height * gameState.tileH));

    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i in grid) {
        let px = offsetX + (grid[i].x * gameState.tileW);
        let py = offsetY + (grid[i].y * gameState.tileH);

        if (gameState.screen == 'lost' && grid[i].hasMine) {
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(px, py,
                gameState.tileW, gameState.tileH);
            ctx.fillStyle = "#000000";
            ctx.fillText("x", px + halfW, py + halfH);
        } else if (grid[i].currentState == 'visible') {
            ctx.fillStyle = "#dddddd";

            if (grid[i].danger) {
                ctx.fillStyle = "#000000";
                ctx.fillText(grid[i].danger, px + halfW, py + halfH);
            }
        } else {
            ctx.fillStyle = "#cccccc";
            ctx.fillRect(px, py,
                gameState.tileW, gameState.tileH);
            ctx.strokeRect(px, py,
                gameState.tileW, gameState.tileH);

            if (grid[i].currentState == 'flagged') {
                ctx.fillStyle = "#0000cc";
                ctx.fillText("💣", px + halfW, py + halfH);
            }
        }
    }
}

function drawGame() {
    if (ctx == null) {
        return;
    }

    // Frame & update related timing
    let currentFrameTime = Date.now();
    if (lastFrameTime == 0) {
        lastFrameTime = currentFrameTime;
    }
    let timeElapsed = currentFrameTime - lastFrameTime;
    gameTime += timeElapsed;

    // Update game
    updateGame();

    // Frame counting
    let sec = Math.floor(Date.now() / 1000);
    if (sec != currentSecond) {
        currentSecond = sec;
        framesLastSecond = frameCount;
        frameCount = 1;
    } else {
        frameCount++;
    }

    // Clear canvas
    ctx.fillStyle = "#ddddee";
    ctx.fillRect(0, 0, 300, 400);

    if (gameState.screen == 'menu') {
        drawMenu();
    } else {
        drawPlaying();
    }

    // Draw the frame count
    ctx.textAlign = "left";
    ctx.font = "10pt sans-serif";
    ctx.fillStyle = "#000000";
    ctx.fillText("Frames: " + framesLastSecond, 5, 15);

    // Update the lastFrameTime
    lastFrameTime = currentFrameTime;

    // Wait for the next frame...
    requestAnimationFrame(drawGame);
}

function realPos(x, y) {
    let p = document.getElementById('game');

    do {
        x -= p.offsetLeft;
        y -= p.offsetTop;

        p = p.offsetParent;
    } while (p != null);

    return [x, y];
}