exports = async function(pipeline){
  const databaseName = context.values.get("databaseName");
 
  const gameTSCollectionName = context.values.get("gameTSCollectionName");
 
  var gameTSCollection = context.services.get("mongodb-atlas").db(databaseName).collection(gameTSCollectionName);

  rval={}
  
  if(! Array.isArray(pipeline)) {
      pipeline = [pipeline]
  } //We passed and Object not an Array
  pipeline.push({$project:{_id:0}}); //We dont need _id 
  try 
  {
    console.log(JSON.stringify(pipeline))
     var result = await gameTSCollection.aggregate(pipeline).toArray();
     rval = { ok: true, data: result}
  } catch(e) {
      rval = { ok: false, error: e.message}
  }
    return rval;

}