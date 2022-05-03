//Search player info for anything offensive

exports = async function(username,nsfw){
  const databaseName = context.values.get("databaseName")
  const nsfwTestCollectionName = context.values.get("nsfwTestCollectionName")
  const nsfwCollectionName = context.values.get("nsfwCollectionName")
  
  let nsfwCollection = context.services.get("mongodb-atlas").db(databaseName).collection(nsfwTestCollectionName);
   let maxedits=2
  if(nsfw) { 
    console.log("Checking Real Offensive Word List")
    nsfwCollection = context.services.get("mongodb-atlas").db(databaseName).collection(nsfwCollectionName);
    maxedits=1
  }
  
  console.log(`Checking username ${username}`)
  searchdef = {
    text: { 
        query: username, 
        path: "_id",
        fuzzy:{ maxEdits: maxedits}
    }
  }
toreview = await nsfwCollection.aggregate([{$search:searchdef},{$project:{score:{$meta:"searchScore"}}}]).toArray();

return toreview;
};