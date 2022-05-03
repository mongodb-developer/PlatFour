//Used to simulate what the back end does for testing.

let gameState = null
const gameGridSize = 8
const nPucksPerSide = 12
const scoretable = [1,2,5,10,20] //TODO larger

function initGameState() {
    gameState = {}
    let map = new Array(gameGridSize).fill(0).map(() => new Array(gameGridSize).fill(0));
    gameState.map = map;
    gameState.players = ["player1", "player2"]
    gameState.scores = [0, 0]
    gameState.gridSize = gameGridSize
    gameState.pucks = new Array(2).fill(0).map(() => new Array(nPucksPerSide));
    gameState.nPucksPerSide = nPucksPerSide;


    //Should be random but get from server.
    let spots = {}

    for (let puck = 0; puck < nPucksPerSide; puck++) {
        for (let player = 0; player < 2; player++) {
            let placed = false;
            while (!placed) {
                let px = Math.floor((Math.random() * gameGridSize))
                let py = Math.floor((Math.random() * gameGridSize))
                if (!spots[`${px}_${py}`] && !spots[`${px+1}_${py}`] && !spots[`${px+1}_${py}`] && !spots[`${px}_${py+1}`] && !spots[`${px}_${py-1}`]) {
                    spots[`${px}_${py}`] = true;
                    gameState.pucks[player][puck] = { x: px, y: py, active:true };
                    placed = true;
                }
            }
        }
    }
}
//On server we need to redo checks

async function getGameState() {
    return gameState;
}

//Simple recursive flood fill algorithm used to find  groups
function getConnected(x, y, player, found, checked) {

    if (checked == null) { checked = {} }
    let sv = `${x}_${y}` 

    if (checked[sv]) { return; }  else { checked[sv] = true }

    let matches = false;
    gameState.pucks[player].forEach(puck => { if (puck.x == x && puck.y == y) { matches = true } })


    if (matches) {
        //Add this to the list of found
        found[sv]=true;
        //Check surrounding squares
        if (x > 0) getConnected(x - 1, y, player, found, checked);
        if (x < gameState.gridSize - 1) getConnected(x + 1, y, player, found, checked);
        if (y > 0) getConnected(x, y - 1, player, found, checked);
        if (y < gameState.gridSize - 1) getConnected(x, y + 1, player, found, checked);
    }
    return;
}


async function processMove(direction, rowcol) {

    if (direction == "right" || direction == "left") {
       
        let d = (direction == "right") ? 1 : -1;
        for (let puckno = 0; puckno < nPucksPerSide; puckno++) {
            for (let player = 0; player < 2; player++) {
                let puck = gameState.pucks[player][puckno]
                if (puck.y == rowcol) { puck.x = (puck.x + d + gameState.gridSize) % gameState.gridSize }
            }
        }
    }

    if (direction == "top" || direction == "bottom") {
       
        let d = (direction == "bottom") ? 1 : -1;
        for (let puckno = 0; puckno < nPucksPerSide; puckno++) {
            for (let player = 0; player < 2; player++) {
                let puck = gameState.pucks[player][puckno]
                if (puck.x == rowcol) { puck.y = (puck.y + d + gameState.gridSize) % gameState.gridSize }
            }
        }
    }


    setTimeout(findClusters,200);
    return gameState
}

async function findClusters()
{
  //Now we need to check each puck to see if it's in a group
    //There is a little more efficiency we can have here as we check pucks in groups of 2 twice
    for (let player = 0; player < 2; player++) {
        for (let puckno = 0; puckno < nPucksPerSide; puckno++) {
            let puck = gameState.pucks[player][puckno]
            //Check if we already deleted this puck
            if (puck.active) {
                //console.log(`Checking ${JSON.stringify(puck)}`)
                    let found = {}
                    getConnected(puck.x, puck.y, player,found)
                    if (Object.keys(found).length  > 2) {
                
                       //Flag them as not in play and move them off board
                       gameState.pucks[player].forEach( p => { if(found[`${p.x}_${p.y}`]) { p.x=-2; p.y=-2;p.active=false;}})
                       gameState.scores[player] += scoretable[Object.keys(found).length-3]
                    }
            }
        }
    }
    parseGameState(gameState);

}