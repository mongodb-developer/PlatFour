
"use strict";

let vueApp = null;
let realmApp = null;
let realmUser = null;
const refreshRate = 500;


Vue.directive('visible', function (el, binding) {
    "use strict";
    el.style.visibility = !!binding.value ? 'visible' : 'hidden';
});



async function initRealmApp() {
    "use strict";
    realmApp = new Realm.App({ id: "platfour-qhfdw" });
    //Dont log in again  if we are logged in
    realmUser = realmApp.currentUser
    if (!realmUser) {
        const credentials = Realm.Credentials.anonymous();
        try {
            realmUser = await realmApp.logIn(credentials);
        } catch (err) {
            alert("Failed to log in", err);
            console.log(err)
        }
    }
}

async function newRealmUser() {

    if (realmApp.currentUser) {
        console.log("Log out from Realm")
        await realmApp.currentUser.logOut()
    }

    const credentials = Realm.Credentials.anonymous();
    try {
        realmUser = await realmApp.logIn(credentials);
        console.log("New Realm User created")
    } catch (err) {
        alert("Failed to log in", err);
        console.log(err)
    }

}

async function onLoad(viewOnly) {
    "use strict";
    await initRealmApp();

    vueApp = new Vue({
        el: '#main_view',
        data: {
            numCols: 7,
            columns: [[], [], [], [], [], [], []],
            names: ["", ""],
            showlogin: true,
            response: {},
            turnNo: 0,
            playerNo: 0,
            status: "Waiting for Server",
            gameId: 0,
            name: "",
            winLine: {},
            winner: {},
            interval: null,
            lastOp: "",
            viewOnly,
            takeTurns: true
        },
        methods: { getPuckStyle, startGame, endGame, tapHandler, getStatus, getWinLine }

    });

    const storedName = localStorage.getItem("ADPGameName");
    if (storedName && storedName.includes("TestBot") == false) {
        vueApp.name = storedName;
    } else {
        //We are not reusing a stored name - so we also want a new Anonymous Realm user
        await newRealmUser();
    }

    if (viewOnly) {
        await startView();
    } else {

        if (!viewOnly && window.location.search == "?auto") {
            console.log("Autobot Engage")
            let minTime = 1500
            let maxTime = 5000
            if (Math.random() < 0.1) {
                minTime = 100
                maxTime = 300
                console.log("Cheating")
            }
            setTimeout(function () { autoPlay(true, minTime, maxTime) }, Math.random() * (maxTime-minTime) + minTime);
        }

        if (!viewOnly && window.location.search == "?automayhem") {
            let minTime = 500
            let maxTime = 500
            console.log("Autobot Engage")
            setTimeout(function () { autoPlay(false, minTime, maxTime) },  Math.random() * (maxTime-minTime) + minTime); //400 to 10000ms
        }

    }

}




//Process message from server into vue object - This may be the inital version or an update
//On the server we are using a 2d array but in Vue a 1d array 

function parseGameState(gameState) {
    "use strict";
    if (gameState == null) return;
    if (gameState.columns == null) return;

    //vueApp.columns = gameState.columns
    for (let ci = 0; ci < gameState.columns.length; ci++) {
        const col = gameState.columns[ci];
        for (let ri = 0; ri < col.length; ri++) {
            vueApp.columns[ci][ri] = col[ri]
        }
        //Add an extra invisible one seed the animated transition
        vueApp.columns[ci][col.length] = 0;
    }

    //Only do this for booth view
    if (vueApp.viewOnly) {
        vueApp.response = displayGameDocument(gameState);
        vueApp.lastOp = displayLastUpdate(gameState)
    }

    vueApp.takeTurns = gameState.turnmode;
    vueApp.turnNo = gameState.turncount;
    //  console.log(`Turn:${gameState.turncount} ${gameState._id} ${gameState.status}`)
    vueApp.playerNo = gameState.players.indexOf(realmUser.id)
    vueApp.gameId = gameState._id
    vueApp.status = gameState.status;


    vueApp.names = gameState.names;
    vueApp.winner = gameState.winner;
    if (gameState.winLine) {
        vueApp.winLine.from = gameState.winLine.from;
        vueApp.winLine.to = gameState.winLine.to;
    }
}

async function refreshUI() {
    "use strict";
    let lastTurn = vueApp.turnNo

    let gameState = await getUpdate(vueApp.gameId, lastTurn);

    if (gameState) {
        parseGameState(gameState)
    }

    if (vueApp.status == "timedout") {
        vueApp.showlogin = true; //Revert to login on titmeout
        resetData();
    }
    return;
}

async function tapHandler(event) {
    "use strict";
    //Only on my turn and in a game

    if (vueApp.status != "live") return;
    //Support Mayhem mode
    if ((vueApp.turnNo % 2) != vueApp.playerNo && vueApp.takeTurns == true) return;

    let clientX = event.clientX;
    let clientY = event.clientY;
    let column;

    if (clientX > 0 && clientY > 0) {
        //It was a Mouse Click
    } else {
        //It was a Finger tap
        const touch = event.changedTouches[0]
        clientX = touch.clientX;
        clientY = touch.clientY
    }

    const gridElement = document.getElementById("game_grid");
    const gridX = (clientX / gridElement.clientWidth);
    column = Math.floor(gridX * vueApp.numCols);
    await processMove(vueApp.gameId, vueApp.playerNo, column, vueApp.takeTurns)
}

window.mobileAndTabletCheck = function () {
    "use strict";
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};


function resetData() {
    "use strict";
    vueApp.gameid = 0;
    for (let c = 0; c < 7; c++) { vueApp.columns[c] = [] }
    vueApp.turnNo = 0;
    vueApp.winLine = {}
}

//Quit Game

async function endGame() {
    "use strict";
    await abandonGame(vueApp.gameId);
    resetData();
    vueApp.showlogin = true;
}

//Start Playing
async function startGame(takeTurns) {
    "use strict";
    const game = document.getElementById("main_view");
    if (game && mobileAndTabletCheck()) {

        if (game.requestFullScreen) {
            game.requestFullScreen();
        } else if (game.mozRequestFullScreen) {
            game.mozRequestFullScreen();
        } else if (game.webkitRequestFullScreen) {
            game.webkitRequestFullScreen();
        }
    }

    localStorage.setItem("ADPGameName", vueApp.name)
    let gameState = await initGameState(vueApp.name, takeTurns);
    if (gameState && gameState.offensive_word_match) {
        console.log(JSON.stringify(gameState))
        gameState = null;
    }
    if (gameState == null) {
        vueApp.showlogin = true
        vueApp.name = "MeaCulpa"
        return;
    }
    //console.log(`state: ${JSON.stringify(gameState)}`);
    parseGameState(gameState)
    vueApp.showlogin = false
    setupWatch(vueApp.gameId);
    //console.log(`Explicit Check: ${new Date} ${vueApp.gameId}`)
    gameState = await getUpdate(vueApp.gameId, 0);
    parseGameState(gameState)

}

async function setupWatch(gameId) {
    const mongo = realmApp.currentUser.mongoClient("mongodb-atlas");
    const games = mongo.db("ADPDemoGame").collection("games");
    //Also get it again to make sure we didn't miss anything before we got that set up.
    //console.log(`Watching: ${new Date} ${gameId}`)


    while (true) {
        try {
            for await (const change of games.watch({ ids: [gameId] })) {
                const { documentKey, fullDocument } = change;
                //console.log(`Change Seen: ${change._id._data} ${new Date} ${gameId}`)

                if (fullDocument) {
                    parseGameState(fullDocument)
                }

                if (vueApp.viewOnly) {
                    if (vueApp.status != "live") {

                        setTimeout(startView, 1000) //Try again in 1 second
                        break;
                    }
                }
                if (vueApp.status == "timedout") {
                    vueApp.showlogin = true; //Revert to login on timeout
                    resetData();
                    break;
                }
            }
        } catch (e) {
            console.error(e.message)
            location.reload()
        }
    }


}

//Start observing a Game
async function startView() {
    "use strict";
    let lastTurn = 0
    resetData();
    let gameState = await getUpdate("viewany", lastTurn);  //Find something to watch    
    if (gameState) {
        if (gameState != "live") { resetData(); }
        parseGameState(gameState)
        setupWatch(vueApp.gameId);
    } else {
        setTimeout(startView, 1000) //Try again in 1 second
    }


}

function getStatus() {
    "use strict";
    if (!vueApp) return "";

    if (vueApp.status == "live") {
        if (vueApp.takeTurns == false) return "Mayhem"
        if (vueApp.turnNo % 2 == vueApp.playerNo) return "Your Turn";
        else return "Waiting for opponent to play";
    } else if (vueApp.status == "waitingForSecondPlayer") {
        return "Waiting for another player to join game."
    } else if (vueApp.status == "win") {
        return `${vueApp.names[vueApp.winner - 1]} Wins!!`
    } else if (vueApp.status == "abandoned") {
        return `Your opponent quit!!`
    } else {
        //TODO - Friendly Status Messages
        return vueApp.status
    }
}

