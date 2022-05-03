"use strict";

//Render our output just as we want it - Not elegant and hard coded but simple to understand
//And lots of control
function lastPlayerThinking(obj, playerNo) {
    "use strict";
    let s = ""
    if (obj.turncount % 2 != playerNo) { s = s + '<span class="changed">' }
    s = s + obj.thinkingtime[playerNo];
    if (obj.turncount % 2 != playerNo) { s = s + '</span>' }
    return s;
}
function displayGameDocument(obj) {
    "use strict";
    let s = `{
  _id : "${obj._id}",
  turnmode : ${obj.turnmode},
  players: [ "${obj.players[0]}",\n             "${obj.players[1]}"],
  names: ${JSON.stringify(obj.names)},
  status: "${obj.status == 'live' ? obj.status : '<span class="changed">' + obj.status + '</span>'}",
  turncount: <span class="changed">${obj.turncount}</span>,
  lastUpdateTime: <span class="changed">${JSON.stringify(obj.lastUpdateTime)}</span>,
  lastmove: <span class="changed">${obj.lastmove}</span>,
  columns: [`
    for (let ci = 0; ci < 7; ci++) {
        s = `${s}${ci > 0 ? ",\n" : "\n"}`; //Add newline and comma except on first line
        s = s + '              ['
        for (let q = 0; q < obj.columns[ci].length; q++) {
            if (q > 0) { s = s + "," }
            if (ci == obj.lastmove && q == obj.columns[ci].length - 1) {
                s = s + '<span class="changed">' + obj.columns[ci][q] + '</span>'
            } else {
                s = s + obj.columns[ci][q]
            }
        }
        s = s + ']'

        //s = `${s}            ${JSON.stringify(obj.columns[ci])}`
    }

    s = s + '\n           ]'
    if (obj.winner) {
        s = s + `,\n  winner : <span class="changed"> ${obj.winner} </span>`
    }
    if (obj.winner) {
        s = s + `,\n  winLine : <span class="changed"> ${JSON.stringify(obj.winLine)} </span>`
    }
    s = s + '\n  }'

    return s;
}

//JSON.stringify wasn't letting me have enough control
function myStringify(obj, key, indent, depth) {
    "use strict";
    if (!depth) depth = 0;

    if (depth > 1) return JSON.stringify(obj)

    if (key == "_id") {
        //return "ObjectId("+JSON.stringify(obj)+")";
        return JSON.stringify(obj);
    }
    if (obj instanceof Date) {
        return "Date(" + JSON.stringify(obj) + ")";
    }

    if (obj instanceof Array) {
        return JSON.stringify(obj);
    }

    if (obj === Object(obj)) {

        let s = ""
        if (depth == 0) { s = s + " ".repeat(indent); }
        depth++
        s = s + "{\n"
        let first = true;
        for (let key in obj) {
            if (!first) {

                s = s + ",\n"
            }
            s = s + " ".repeat(indent + depth * 4);
            s = s + key + ": " + myStringify(obj[key], key, indent, depth)
            first = false;
        }
        s = s + " ".repeat(indent);
        s = s + "\n" + " ".repeat(indent + depth * 4) + "}"
        return s;
    }

    return JSON.stringify(obj);

}
function displayLastUpdate(obj) {
    "use strict";
    if (obj.updates && obj.updates.length) {
        const lastUpdate = obj.updates[obj.updates.length - 1]
        //console.log(lastUpdate)
        let s = "updateOne(\n"
        let query = lastUpdate.query
        s = s + myStringify(query, "", 4)
        s = s + ",\n"
        let updateops = lastUpdate.updateOps
        s = s + myStringify(updateops, "", 4)

        s = s + "\n)"
        return s;
    }
}
