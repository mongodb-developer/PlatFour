// If the user is already in an active game then returns that object.
// If there is a new game awaiting a second player then returns that object
// If there is no current game then creates a new game object
//This shows ACID properties of MDB docs too

function getNewGameDoc(playerId,nickname,takeTurns)
{
  const numCols = 7
  let gameState = {}
    
    let columns = new Array(numCols).fill([]);
    gameState.columns = columns;
    //Test
    gameState.columns = [ [],[],[],[],[],[],[]];
    gameState.players = [playerId]; 
    gameState.names = [nickname];
    gameState.thinkingtime = [0,0];
    gameState.turncount = 0;
    gameState.turnmode = takeTurns;
    gameState.status = "waitingForSecondPlayer";
    gameState.lastUpdateTime = new Date();

    return gameState;
}

function minsago(mins) {
  rval = new Date();
  rval = rval.setMinutes(rval.getMinutes()-mins)
  return rval;
}
exports = async function(nickname,takeTurns){
    let playerId = context.user.id
  const databaseName = context.values.get("databaseName")
  const gameCollectionName = context.values.get("gameCollectionName")
  const infoCollectionName = context.values.get("infoCollectionName")
  
  let nsfw = await context.functions.execute("isOffensiveUsername",nickname,true);
  if(nsfw && nsfw.length) {
      console.log(`Username: ${nickname} denied ${JSON.stringify(nsfw)}`)
      return {offensive_word_match:JSON.stringify(nsfw)};
  }

  let gameCollection = context.services.get("mongodb-atlas").db(databaseName).collection(gameCollectionName);
  let infoCollection = context.services.get("mongodb-atlas").db(databaseName).collection(infoCollectionName);
  
  
  const { remoteIPAddress, httpUserAgent} = context.request;
  const playerInfo = { remoteIPAddress, httpUserAgent,nickname,takeTurns,playerId} 
  
  //Look for a game in progress I am in (maybe page reloaded)
  //It must have had an update in the last 2 minutes
  
  let query = { players : playerId, status: {$in : ['live','waitingForSecondPlayer']} }
  let gameDoc = await gameCollection.findOne(query)

  if(gameDoc != null) { return gameDoc }
  
  await infoCollection.insertOne(playerInfo)
   /* Now we need to look for a game we can join, and if we find it we need to atomically
      join so this is an update  */
   
  
   query = { status: "waitingForSecondPlayer", turnmode: takeTurns };
   let update= { $push : { "players": playerId ,names: nickname},
                  $set :{ lastUpdateTime : new Date(), status:"live", startTime: new Date() } };
   
   let options= {returnNewDocument: true}
   
   
   
    try{
      gameDoc = await gameCollection.findOneAndUpdate(query,update,options);
    } catch (e)
    {
      console.log(e)
      gameDoc = null; //Doesn't just return null on no result
    }
  
   if(gameDoc != null) { return gameDoc }
    
    let newGameDoc = getNewGameDoc(playerId,nickname,takeTurns);
    let rval = await gameCollection.insertOne(newGameDoc)
    newGameDoc['_id'] = rval.insertedId
    return newGameDoc;
};