async function initGameState(nickname,takeTurns) {
    let newGame = {}
    try {
        newGame = await realmUser.functions.joinGame(nickname,takeTurns);
    } catch(e) {
        console.error(e)
    }
    return newGame;
}

async function processMove(gameId,playerNo,column,turnmode)
{
    try {
        await realmUser.functions.processMove(gameId,playerNo,column,turnmode);
    } catch(e) {
        console.error(e)
    }
}

async function getUpdate(gameId,lastTurn)
{
    let gameState = {}
    try {
        //Returns null if no new update
        gameState = await realmUser.functions.getGameUpdate(gameId,lastTurn);
    } catch(e) {
        console.error(e)
    }
    return gameState
}


async function abandonGame(gameId)
{
    let gameState = {}
    try {
        //Returns null if no new update
        gameState = await realmUser.functions.abandonGame(gameId);
    } catch(e) {
        console.error(e)
    }
    return gameState
}
