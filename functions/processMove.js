
exports = async function(gameId,playerNo,column,turnmode)
{
  //Check for bad parameter
  if(column<0 || column >6) return null;

  let playerId = context.user.id;  
  const databaseName = context.values.get("databaseName");
  const gameCollectionName = context.values.get("gameCollectionName");
  const gameTSCollectionName = context.values.get("gameTSCollectionName");
  var gameCollection = context.services.get("mongodb-atlas").db(databaseName).collection(gameCollectionName);
  var gameTSCollection = context.services.get("mongodb-atlas").db(databaseName).collection(gameTSCollectionName);

  //TODO - factor this out as it requires a read
  let query = { _id: gameId, status: 'live', turnmode }; //This game and still live

  //Construct an Update to Perform the drop if legal and grab the resonse.
  //Add the conditions
  query[`columns.${column}`] =  {$not: {$size: 6 }}; // This column is not full
  query[`players.${playerNo}`] =  playerId //We sent a correct playerNo
  //Check it's our turn if we are in turnmode
  if(turnmode) {
    query['turncount'] = { $mod : [ 2,playerNo]} //Do not use in mayhem play
  }
  
  //Define the Change We want
  const timeNow = new Date();
  update_sets = { lastUpdateTime: timeNow ,lastmove: column}
  update_increments = { turncount : 1 }
  update_pushes = {}
  update_pushes[`columns.${column}`]=playerNo+1
  
  
  update = { $set: update_sets, $inc: update_increments, $push: update_pushes}
  
  //Add a field showing the last update so we can show on the Booth UI
  logOperation(query,update)

  
  let options= {returnNewDocument: true}
  let postMoveState = null;

  try {
    postMoveState = await gameCollection.findOneAndUpdate(query,update,options);
  } catch (e) {
    console.log(e); // Throws exception should return null
  }
  
  if(postMoveState == null) { 
    console.log("Invalid Move Attempt - denied")
    console.log(JSON.stringify(query,null,2))
    return null; //We changed nothing no winner check needed
  }
  
  //Record Time Series Info on move
  let gameTime =  timeNow.getTime() - postMoveState.startTime;
  gameTSCollection.insertOne({gameId,column,timeNow,gameTime,playerId,turncount:postMoveState.turncount,status:postMoveState.status,turnMode:postMoveState.turnmode});
  return null; //Picked up by watch()
};


function  logOperation(query,update)
{

  updateOps = EJSON.parse(EJSON.stringify(update)); //Deep Copy
  
  console.log(updateOps)
  
  if (update['$push'] ) {
  update['$push']['updates']={query,updateOps} //Passing back info on what query we ran
  } else {
    update['$push'] = { updates: {query,updateOps}}
  }
}
