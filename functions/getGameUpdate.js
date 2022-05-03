

exports = async function(gameId,lastTurn){

  let playerId = context.user.id;  
  const databaseName = context.values.get("databaseName");
  const gameCollectionName = context.values.get("gameCollectionName");
  
  var gameCollection = context.services.get("mongodb-atlas").db(databaseName).collection(gameCollectionName);
 
  if (gameId == "viewany") {
    let gameState = await gameCollection.find({status:"live"}).sort({_id:-1}).limit(1).toArray();
    console.log("Returning any live game")
    return gameState[0];
  } 
  //Look for a game in progress I am in (maybe page reloaded)
 
  let query = { _id: gameId }
  let gameState = await gameCollection.findOne(query);
  if(gameState == null) { console.log('no game with Id'); return null;} //We aren't in a game but we made a move - error.
  //Check and it it's live and turn is <= larturn return null - we have this info.
  if(gameState.status == "live" && lastTurn > 0 && gameState.turncount == lastTurn) { return null;} //No change
  return gameState;
};