exports = async function(changeEvent) {
  
    const docId = changeEvent.documentKey._id;

   
    const ip = changeEvent.fullDocument.remoteIPAddress;
    console.log(JSON.stringify(changeEvent.fullDocument))
  
    const collection = context.services.get("mongodb-atlas").db("ADPDemoGame").collection("playerInfo");


    
    
    const response = await context.http.get({ url: `http://ip-api.com/json/${ip}`})
    
    collection.updateOne({_id:docId},{$set:{ipinfo:JSON.parse(response.body.text())}}).catch(console.error);
 
};
