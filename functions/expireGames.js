exports = async function() {
  
    const databaseName = context.values.get("databaseName");
  const gameCollectionName = context.values.get("gameCollectionName");
  
  const gameCollection = context.services.get("mongodb-atlas").db(databaseName).collection(gameCollectionName);
 
  let twominsago = new Date(Date.now() - 300000);
  const query = { lastUpdateTime : { $lt : twominsago}, status: "live"}
  const update = { $set: { status: "timedout"}}
  try {
    await gameCollection.updateMany(query,update);
  }
  catch(e) {
    console.error(e)
  }
};
