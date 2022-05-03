

//Add Start Time, this is not the _id but the first update minus the first update time
//Do taht before unwind - we need this to compute gameTiem from updateTimes
onlyclassic = {$match : {turnmode:true}}


extractFirstUpdate = { $set : { firstUpdate : {$first:"$updates"}}}
getSetsAndIncs = { $set: { firstUpdate : { 
    sets: {$getField: { field: {$literal: "$set"}, input: "$firstUpdate.updateOps"}},
    incs: {$getField: { field: {$literal: "$inc"}, input: "$firstUpdate.updateOps"}},
} }}
cd..
getSetsAndIncs2 = { $set: {firstUpdateTime : "$firstUpdate.sets.lastUpdateTime",
  firstUpdateThinking :  {$getField: { field: "thinkingtime.0", input: "$firstUpdate.incs"}
}}}

addStart = {$set : { firstUpdate: "", startTime : { $subtract : ["$firstUpdateTime","$firstUpdateThinking"]}}}


unwindmoves = {$unwind:{path:"$updates",includeArrayIndex:"turnIndex"}}

getSetsAndIncs3 = { $set: { currentUpdate : { 
    sets: {$getField: { field: {$literal: "$set"}, input: "$updates.updateOps"}},
    incs: {$getField: { field: {$literal: "$inc"}, input: "$updates.updateOps"}},
} }}


project = { $project : { _id:0, gameId: "$_id",
startTime : 1,
column: "$currentUpdate.sets.lastmove",
turnCount: {$add:["$turnIndex",1]},
timeNow: "$currentUpdate.sets.lastUpdateTime",
gameTime: {$toDouble:{$subtract : [ "$currentUpdate.sets.lastUpdateTime","$startTime"]}},
playerId: "$updates.query.players",
status: { $cond : [ { $eq : ["$turnIndex", {$subtract:["$turncount",1]} ]}, "$status", "live"]},
turnMode: {$literal:true},
timeTaken: {$sum: [ {$getField: { field: "thinkingtime.1", input: "$currentUpdate.incs"}}, {$getField: { field: "thinkingtime.0", input: "$currentUpdate.incs"}}]},
startTime: "$$REMOVE"
}}

removeLast = { $match: {column:{$ne:null}}}
writemoves = {$out:"moves"}
db.humangames.aggregate([onlyclassic,{$limit:1},extractFirstUpdate,getSetsAndIncs,getSetsAndIncs2,addStart,unwindmoves,getSetsAndIncs3 ,project,removeLast,writemoves])


{
    _id: ObjectId("62557980a5875d4896aa2067"),
    gameId: ObjectId("625578e6a5875d4896a9978d"),
    column: 4,
    timeNow: ISODate("2022-04-12T13:07:12.929Z"),
    gameTime: 52324,
    playerId: '623c66f03e39839862cf2c9e',
    turncount: Long("1"),
    timeTaken: 52324,
    status: 'live',
    turnMode: true
  }
