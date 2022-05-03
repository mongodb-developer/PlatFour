const puckColours = ["transparent", "#00D2FF", "#FFE212"];

function getPuckStyle(colidx, puckidx, puck) {
    "use strict";
    const squarePCX = 100 / 7; /* 7 Columns */
    const squarePCY = 100 / 6; /* 6 Rows*/
    let rval = {
        top: `${100 - (puckidx + 1) * squarePCY}%`,
        left: `${colidx * squarePCX}%`,
        height: `${squarePCY * 0.8}%`,
        width: `${squarePCX * 0.8}%`,
        backgroundColor: puckColours[puck]
    };
    if (puck == 0) {
        rval['top'] = "0%";
    }
    //console.log(rval)
    return rval;
}

function getWinLine() {
    "use strict";
    //No winner just hide it
    const squarePCX = 100 / 7; /* 7 Columns */
    const squarePCY = 100 / 6; /* 6 Rows*/

    const winLine = vueApp.winLine;
    if (!winLine.from) return {};
    //winLine = { from: [1,1], to: [0,3] }
    //Get a start point
    let left = (winLine.from[0] + 0.45) * squarePCX
    let top = 100 - ((winLine.from[1] + 0.55) * squarePCY)

    let linex = (winLine.from[0] - winLine.to[0]) * squarePCX
    let liney = (winLine.from[1] - winLine.to[1]) * squarePCY
    let linelen = ((linex ** 2 + liney ** 2) ** 0.5) * 1.2; //Extra helps
    let angle = Math.atan2(linex, liney)

    //console.log(` ${JSON.stringify({ linex, liney, linelen, angle })}`)
    let style = {
        position: `absolute`,
        background: `red`,
        left: `${left}%`,
        top: `${top}%`,
        display: `block`,
        width: `10px`,
        height: `${linelen}%`,
        transform: `rotate(${angle}rad)`,
        "transform-origin": `5px 5px`,
        'border-radius': '10%',
        opacity: 0.9
    }
    return style;
}