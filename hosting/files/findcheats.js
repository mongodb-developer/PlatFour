
let realmApp = null;
let vueApp = null;

function compactJSON(str) {

  let newstr = ""
  let inarray = 0;

  for (c = 0; c < str.length; c++) {
    const char = str[c]
    if (char == '[') inarray++;
    if (char == ']') inarray--;

    if (inarray > 1 && (char == "\n" || char == " ")) continue; //no newlines in arrays

    newstr += char;
  }

  return newstr;
}

function getExamples() {
  examples = [{ name: "All Data", code: "[{$sort:{timeNow:-1}},{$limit:5000}]", x: "timeNow", y: "turncount" }]
  console.log(examples)
  //Thery is a real player gets slower as a game progresses
  //A bot plays at a constant speed
  //How can we detect this

  //Make GameTime into a date
  noLongPause = { $match: { gameTime: { $lt: 30000 } } };

  getLastMove = {
    $setWindowFields: {
      partitionBy: "$gameId",
      sortBy: { gameTime: 1 },
      output: {
        moveTime: {
          $first: "$gameTime",
          window: {
            documents: [-1, "current"]
          }

        }
      }
    }
  };

  calcMoveTime = {
    $set: {
      moveTime: {
        $subtract: ["$gameTime", "$moveTime"]
      }
    }
  }
  max10s = { $match: { moveTime: { $lt: 10000 } } }
  moveTimePipeline = JSON.stringify([noLongPause, getLastMove, calcMoveTime, max10s], null, 2)
  examples.push({ name: "Time Per Move", code: moveTimePipeline, x: "moveTime", y: "turncount" })

  avgByPlayer = { $group: { _id: "$playerId", longest: { $max: "$moveTime" }, ave: { $avg: "$moveTime" }, moves: { $sum: 1 } } }

  tidyUp = { $set: { playerId: "$_id" } }

  cheatsFirst = { $sort : { ave: 1}}
  aveMoveTimePlayerPipeline = JSON.stringify([noLongPause, getLastMove, calcMoveTime, avgByPlayer,tidyUp,cheatsFirst], null, 2)
  examples.push({ name: "Mean Move Time by Player", code: aveMoveTimePlayerPipeline, x: "ave", y: "moves" })

  movesOverTimePipeline = JSON.stringify([noLongPause, getLastMove, calcMoveTime], null, 2)
  examples.push({ name: "Move Times over Game", code: movesOverTimePipeline,x: "gameTime", y: "moveTime" })
  return examples;
}

function exampleChange(value) {
  vueApp.aggregation = vueApp.selectedExample.code;
  vueApp.xaxis = vueApp.selectedExample.x
  vueApp.yaxis = vueApp.selectedExample.y
}

//Connect to the App and Authenticate (Anonymous distinct user)
function onLoad() {
  "use strict";
  console.log("Connecting")
  realmApp = new Realm.App({ id: "adpdemo-maiek" });
  if (!realmApp.currentUser) {
    realmApp.logIn(Realm.Credentials.anonymous()).catch((err) => { console.log(err) });
  }

  vueApp = new Vue({
    el: '#main_view',
    data: {
      selectedExample: "",
      examples: getExamples(),
      results: [{ currentTime: new Date, x: 1, y: 2 }],
      fields: ["currentTime", "x", "y"],
      aggregation: "",
      chart: null,
      xaxis: "timeNow",
      yaxis: "turncount"
    },
    methods: { runPipeline, formatColumn, runChart, exampleChange }

  });

  runChart();
}


async function runPipeline() {
  agg = vueApp.aggregation
  console.log(agg)
  vueApp.results = [];
  vueApp.fields = [];

  if (!agg.includes("{")) agg = "[]" //Empty

  let aggObj;

  try {
    var correctJson = agg.replace(/(['"])?([$a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
    aggObj = JSON.parse(correctJson);
  }
  catch (e) {
    //output.innerHTML = `<span style="color: orangered">Parse Error: ${e.error}<span>`
    console.log(e.message)
    vueApp.fields = ["parseerror"];
    vueApp.results = [{ parseerror: e.message }]
    return;
  }

  try {
    console.log(aggObj)
    const response = await realmApp.currentUser.functions.aggregatePlays(aggObj)


    if (response.data && response.data.length) {
      vueApp.results = response.data;
      vueApp.fields = Object.keys(response.data[0])
    } else {
      vueApp.fields = ["error"];
      console.log(JSON.stringify(response))
      vueApp.results = [response]
    }

  } catch (e) {
    console.log(e)
    //output.innerHTML = `<span style="color: orangered">Server Error: ${e.error}<span>`
  }
}

function formatColumn(fname, obj) {

  if (obj instanceof Date) {
    return obj.toISOString()
  }

  if (obj && (fname == "gameId" || fname == "playerId")) {
    s = obj.toString();
    return s.substr(0, 4) + "..." + s.substr(-4, 4);
  }
  return obj;
}

//This could be dynamic but I plan to change a lot abotu the chart each time

function runChart() {
  if (vueApp.chart) { vueApp.chart.destroy(); }
  const canvas = document.getElementById("myChart")
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  xyreadings = vueApp.results.map(r => { return { x: r[vueApp.xaxis], y: r[vueApp.yaxis] } })
  //TODO - Make it Smart about plotting dates
  options = { plugins: { legend: { display: false } }, maintainAspectRatio: false }
  if (vueApp.xaxis == "timeNow") {
    options.scales = { xAxis: { type: 'time', time: { unit: 'hour' } } };
  }

  vueApp.chart = new Chart("myChart", {
    type: "scatter", data: {
      datasets: [{
        pointRadius: 2,
        pointBackgroundColor: "rgba(0,255,0,0.5)", data: xyreadings
      }]
    },
    options
  });

}