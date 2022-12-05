
exports = async function(gameId)
{
  let playerId = context.user.id;  
  const databaseName = context.values.get("databaseName");
  const gameCollectionName = context.values.get("gameCollectionName");
  var gameCollection = context.services.get("mongodb-atlas").db(databaseName).collection(gameCollectionName);
  

  let query = { _id: gameId, status: {$in : ["live","waitingForSecondPlayer"]} , players: playerId };
  let update = { $set : { status: "abandoned" }};
   let options= {returnNewDocument: true};
   console.log(JSON.stringify(query));
   try {
  let gameState = await gameCollection.findOneAndUpdate(query,update,options);
    return gameState ;
   } catch(e) {
     console.log(e);
   }

};