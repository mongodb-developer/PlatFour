
//Count How many values are the same as v going in direction dx,dy
//With limit of 6 in dy and 7 in dx
function sumInDirection(columns,x,y,dx,dy,v) {
  let count=0;
  x=x+dx;
  y=y+dy;
  
  while( x>=0 && x<7 && y>=0 && y<6 && columns[x][y] == v && count < 4)
  {
    count++;
    x=x+dx;
    y=y+dy;
  }

  return count;
}


function checkForWinner(gameState, playerNo, column)
{
  //Checking from the puck we just added, are there 4 in a row any direction?
  playerNo=playerNo+1; //We use players 1 and 2 in the matrix to help reading and rendering

  const columns = gameState.columns
  const row = columns[column].length - 1; //We are the top puck
  
  //Easy fix here if we want to exclude vertical from mayhem
  let axes = []
  
  if(gameState.turnmode == true) {
     axes = [[0,1],[1,0],[1,1],[1,-1]]
  } else {
       axes = [[1,0],[1,1],[1,-1]]
  }
  for (const axis of axes) {
    const forecheck =  sumInDirection(columns,column,row,axis[0],axis[1],playerNo)
    const backcheck =  sumInDirection(columns,column,row,-axis[0],-axis[1],playerNo)
    if(forecheck + backcheck >= 3) {
      let winUpdateSets = {}
        winUpdateSets.status="win"
        winUpdateSets.winner = playerNo
        winUpdateSets.winLine = { from: [column-axis[0]*backcheck,row-axis[1]*backcheck], to: [ column+axis[0]*forecheck,row+axis[1]*forecheck] }
        let winUpdate = {$set : winUpdateSets}
        console.log(`Yes`)
        return winUpdate
    }
  }
  console.log(`No`)
  return null;
}

exports = async function(changeEvent){

 const databaseName = context.values.get("databaseName");
  const gameCollectionName = context.values.get("gameCollectionName");
  var gameCollection = context.services.get("mongodb-atlas").db(databaseName).collection(gameCollectionName);

  const gameTSCollectionName = context.values.get("gameTSCollectionName");
  var gameTSCollection = context.services.get("mongodb-atlas").db(databaseName).collection(gameTSCollectionName);
  
  let postMoveState = changeEvent.fullDocument;
  if(postMoveState.status != "live") return; //Can only win a live game
    //We record the last played column in a field called 

 
  const column = postMoveState.lastmove
  let playerNo = (postMoveState.turncount-1) % 2
  let playerId = postMoveState.players[playerNo]
  
  //We can no work out the last player by looking at the number of postMoveState
  if(!postMoveState.turnmode) {
    
    const row = postMoveState.columns[column].length - 1; //We are the top puck
    playerNo =  postMoveState.columns[column][row] - 1;
  }
  

    
  console.log(`Checking to see if player ${playerNo} won`)
  const winUpdate = checkForWinner(postMoveState, playerNo ,column);
  if(winUpdate) {
      console.log(`Player: ${playerNo} Wins`)
    //Update the game to say we won it, if we did this before anyone else did.
    //With ordered events then live checkl  isn't strictly required here
    const winUpdateQuery = { _id: postMoveState._id, status: 'live' }
    logOperation(winUpdateQuery,winUpdate)
    try {
       postMoveState = await gameCollection.updateOne(winUpdateQuery,winUpdate);
       //Record win event in time series
       const timeNow = new Date();
       gameTSCollection.insertOne({gameId:postMoveState._id,column,timeNow,playerId,
       turncount:postMoveState.turncount,status: postMoveState.status,turnMode:postMoveState.turnmode});
      
    }
    catch(e) {
      console.error("Unable to Flag as Winner")
      console.error(e);
    }
  }
  
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
