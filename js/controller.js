var viewMode = 3;
var socket;
var match;

var timeInterval = 10;
var miliseconds = 0;
var currentBatTeam;
var currentState = 0;
var gameState = new Array();
var currentBowlNumber, ballPlayMode;
var t = 0.001;
var played = 0;
var currentPlayed = 0;
var time = 0;
var isRunning = false;

var topLeft = 177,
  topPosition = 216;
var pitchX = 660,
  pitchY = 196;
var w1 = pitchX / 2,
  w2 = 446 / 2,
  hp = pitchY;

var topLeft2 = 100,
  topPosition2 = 183;
var pitchX2 = 600,
  pitchY2 = 229;
var w12 = pitchX2 / 2,
  w22 = 600 / 2,
  hp2 = pitchY2;

var x1 = 0,
  y1 = hp / 2,
  x2 = 0,
  y2 = hp / 2;
var xb = 0,
  yb = 0;
var t, L, H, ll, hh, h1, k;
var x = 0,
  y = mapY(0, hp / 2),
  x_1 = 0,
  y_1 = mapY(0, hp / 2),
  x_b = 0,
  y_b = mapY(0, hp / 2);
var ballRadius = 15;

x_1_1 = mapX(x1, y1);
y_1_1 = mapY(x1, y1);
x_1_2 = mapX(x2, y2);
y_1_2 = mapY(x2, y2);

var goaltype = "";

function countdown() {
  var interval = setInterval(function () {
    changeScreenSize();
    miliseconds += timeInterval;
    if (miliseconds % 1000 == 0) stepInitialize();
    t += timeInterval / 1000;
    if (t > 1) t = 1;
    if (gameState.length) {
      ballPosition();
      if (x1 == x2 && y1 == y2) bounceBall();
      else kickBall();
      showState();
    }
    if (played != currentPlayed) {
      currentPlayed = played;
      time = played * 1000;
    }
    if (isRunning) time += timeInterval;
    let seconds = Math.floor(time / 1000);
    let second = seconds % 60;
    let minutes = Math.floor(seconds / 60);
    $("#time").text(
      Math.floor(minutes / 10) +
        "" +
        (minutes % 10) +
        ":" +
        Math.floor(second / 10) +
        "" +
        (second % 10)
    );
  }, timeInterval);
}
function bounceBall() {
  tt = t;
  x_1 = mapX(x, y);
  y_1 = ((y * y) / hp + y) / 2;
  document
    .getElementById("ball")
    .setAttribute("x", x_b + w2 - ballRadius / 2 + topLeft);
  document
    .getElementById("ball")
    .setAttribute(
      "y",
      y_b - ballRadius + topPosition - 10 + 10 * (tt - 0.5) * (tt - 0.5) * 4
    );
  document.getElementById("ball").setAttribute("width", ballRadius);
  document.getElementById("ball_shadow").setAttribute("cx", x_b + w2 + topLeft);
  document.getElementById("ball_shadow").setAttribute("cy", y_b + topPosition);
  document.getElementById("ball_shadow").setAttribute("rx", 10 * tt);
  document.getElementById("ball_shadow").setAttribute("ry", 5 * tt);
}
function ballPosition() {
  x = x1 + (x2 - x1) * t;
  y = y1 + (y2 - y1) * t; // x is (-0.5, 0.5) in square pitch
  x_1 = mapX(x, y);
  y_1 = mapY(x, y); // x_1 is in polygon pitch
  // For Draw Extra Lines Begin
  // lineX[0] = x_1_1 + w2 + topLeft
  // lineY[0] = y_1_1 + topPosition
  // For Draw Extra Lines End
  L = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  if (L < 0.001) L = 0.001;
  H = L / 8;
  ll = Math.sqrt((x1 - x) * (x1 - x) + (y1 - y) * (y1 - y));
  hh = H * (1 - (4 * (ll - L / 2) * (ll - L / 2)) / (L * L));
  h1 = ((w2 + ((w1 - w2) / hp) * y) * hh) / w1;
  x_b = x_1;
  y_b = y_1 - h1;
  ballRadius = mapX(15, y);
  xs = x_1_1 + (x_1_2 - x_1_1) * t;
  ys = y_1_1 + (y_1_2 - y_1_1) * t;
}
function kickBall() {
  document
    .getElementById("ball")
    .setAttribute("x", x_b + w2 - ballRadius / 2 + topLeft);
  document
    .getElementById("ball")
    .setAttribute("y", y_b - ballRadius + topPosition);
  document.getElementById("ball").setAttribute("width", ballRadius);
  document.getElementById("ball_shadow").setAttribute("cx", x_1 + w2 + topLeft);
  document.getElementById("ball_shadow").setAttribute("cy", y_1 + topPosition);
  if (hh + H > 0) {
    document
      .getElementById("ball_shadow")
      .setAttribute("rx", ((ballRadius + 20) * H * 0.25) / (hh + H));
    document
      .getElementById("ball_shadow")
      .setAttribute("ry", ((ballRadius + 20) * H * 0.25) / (hh + H) / 2);
  } else {
    document.getElementById("ball_shadow").setAttribute("rx", 0);
    document.getElementById("ball_shadow").setAttribute("ry", 0);
  }
}
function mapX(x11, y11) {
  if (viewMode == 3) x_11 = ((w2 + ((w1 - w2) * y11) / hp) * x11) / w1;
  if (viewMode == 2) x_11 = x11;
  return x_11;
}
function mapY(x11, y11) {
  if (viewMode == 3) y_11 = ((y11 * y11) / hp + 1.5 * y11) / 2.5;
  if (viewMode == 2) y_11 = y11;
  return y_11;
}
function load() {
  homeSummary = "0";
  awaySummary = "0";
  ballPlayMode = 0;
  currentBowlNumber = 0;
  countdown();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = Number(urlParams.get("eventId"));
  socket = new WebSocket("wss://gamecast.betdata.pro:8443");
  socket.onopen = function (e) {
    socket.send(JSON.stringify({ r: "subscribe_event", a: { id: eventId } }));
  };

  socket.onmessage = function (e) {
    var data = JSON.parse(e.data);

    if (data.r == "event") {
      // New function added for websocket. Call it.
      handleEventData(data.d);
    }
  };
  // document.getElementById('link').setAttribute('href', '../tennis-2d/index.html?eventId=' + eventId)
}
function max(a, b) {
  if (a > b) return a;
  return b;
}
function setCenterFrame(title, content) {
  $("#awayLine").attr("x1", -100);
  $("#awayLine").attr("x2", -100);
  $("#homeLine").attr("x1", -100);
  $("#homeLine").attr("x2", -100);
  document.getElementById("ball").setAttribute("x", 100000);
  document.getElementById("ball").setAttribute("y", 100000);
  document.getElementById("ball_shadow").setAttribute("cx", 100000);
  document.getElementById("ball_shadow").setAttribute("cy", 100000);

  document.getElementById("center_rect").setAttribute("fill-opacity", 0.5);
  center_text = capitalizeWords(title.split(" ")).join(" ");
  document.getElementById("center_text").textContent = center_text;
  titleWidth = document.getElementById("center_text").getBBox().width + 40;
  document.getElementById("center_rect").setAttribute("height", 140);
  document.getElementById("bottom_text").textContent = content;
  document.getElementById("ball").setAttribute("x", 100000);
  document.getElementById("ball").setAttribute("y", 100000);
  document.getElementById("ball_shadow").setAttribute("cx", 100000);
  document.getElementById("ball_shadow").setAttribute("cy", 100000);
  document
    .getElementById("center_rect")
    .setAttribute("width", max(380, titleWidth));
  document
    .getElementById("center_rect")
    .setAttribute("x", 400 - max(380, titleWidth) / 2);
  if (content == "") {
    document.getElementById("center_text").setAttribute("y", 280);
  } else {
    document.getElementById("center_text").setAttribute("y", 260);
  }
}
function resetCenterFrame() {
  document.getElementById("center_rect").setAttribute("fill-opacity", 0);
  document.getElementById("center_text").textContent = "";
  document.getElementById("center_rect").setAttribute("height", 0);
  document.getElementById("bottom_text").textContent = "";
}
function capitalizeWords(arr) {
  return arr.map((word) => {
    const firstLetter = word.charAt(0).toUpperCase();
    const rest = word.slice(1).toLowerCase();

    return firstLetter + rest;
  });
}
function setGameState() {
  $("#gameState").text(gameState[currentState]["name"]);
  if (gameState[currentState]["points"] == 0) {
    $("#gameState").text("Extra point");
  }
  if (gameState[currentState]["points"] == 1) {
    $("#gameState").text("Extra point");
  }
  if (gameState[currentState]["points"] == 2) {
    $("#gameState").text("Extra point");
  }
  if (gameState[currentState]["points"] == 3) {
    $("#gameState").text("Field Goal");
  }
  if (gameState[currentState]["points"] == 6) {
    $("#gameState").text("Touchdown");
  }
  if (gameState[currentState]["type"] == "penalty_american_football") {
    $("#gameState").text("Penalty");
  }
  if (gameState[currentState]["type"] == "punt_result")
    $("#gameState").text("Punt");
  if (gameState[currentState]["type"] == "kickoff_american_football")
    $("#gameState").text("Kick Off");
  if (gameState[currentState]["type"] == "kickoff_mode_started")
    $("#gameState").text("Kick off");
  if (gameState[currentState]["type"] == "kickoff_mode_ended")
    $("#gameState").text("Kick off");
  if (gameState[currentState]["type"] == "tv_timeout_stop")
    $("#gameState").text("TV Timeout");
  if (gameState[currentState]["type"] == "tv_timeout_start")
    $("#gameState").text("TV Timeout");
  if (gameState[currentState]["type"] == "tv_timeout_ended")
    $("#gameState").text("TV Timeout");
  if (gameState[currentState]["type"] == "videoreview")
    $("#gameState").text("Video Review");
  if (gameState[currentState]["name"] == "Turnover football")
    $("#gameState").text("Turn Over");
  if (gameState[currentState]["type"] == "new_first_down")
    $("#gameState").text("First Down");
  if (gameState[currentState]["name"] == "Ball possession")
    $("#gameState").text("Possession");
  if (gameState[currentState]["name"] == "Timeout over")
    $("#gameState").text("Timeout");
  if (match["status"]["name"] == "Ended") $("#gameState").text("Match End");
  if (
    gameState[currentState]["type"] == "pass" &&
    gameState[currentState]["outcome"] &&
    gameState[currentState]["drive"]
  ) {
    if (gameState[currentState]["outcome"]["text"] == "complete")
      $("#gameState").text("Completed Pass");
    if (gameState[currentState]["outcome"]["text"] == "incomplete")
      $("#gameState").text("Incompleted Pass");
  }
  if (
    gameState[currentState]["type"] == "rush" &&
    gameState[currentState]["outcome"] &&
    gameState[currentState]["drive"]
  ) {
    if (gameState[currentState]["outcome"]["text"] == "complete")
      $("#gameState").text("Completed Rush");
    if (gameState[currentState]["outcome"]["text"] == "incomplete")
      $("#gameState").text("Incompleted Rush");
  }
}
function setYard() {
  if (gameState[currentState]["drive"]) {
    $("#yard").text(gameState[currentState]["drive"]["yards"] + "yards");
    if (gameState[currentState]["points"] > 0)
      $("#yard").text(gameState[currentState]["points"] + "points");
    if (gameState[currentState]["points"] == 0) $("#yard").text("Blocked");
    x2 = ((gameState[currentState]["drive"]["yardline"] - 50) * w1) / 50;
    y2 = (Math.random() * 100 * hp) / 100;
  } else if (gameState[currentState]["outcome"]) {
    $("#yard").text(gameState[currentState]["outcome"]["text"]);
  } else if (gameState[currentState]["team"] != "") {
    $("#yard").text(teamNames[gameState[currentState]["team"]]);
  } else {
    $("#yard").text(homeScore + "-" + awayScore);
  }
  if (match["status"]["name"] == "Ended") {
    $("#yard").text("Winner: " + teamNames[match["result"]["winner"]]);
  }
  if (gameState[currentState]["type"] == "kickoff_mode_started")
    $("#yard").text("Awaiting Kickoff");
  if (gameState[currentState]["type"] == "kickoff_mode_ended")
    $("#yard").text("Ended");
  if (gameState[currentState]["type"] == "tv_timeout_stop")
    $("#yard").text("Ended");
  if (gameState[currentState]["type"] == "tv_timeout_start")
    $("#yard").text(homeScore + "-" + awayScore);
  if (
    gameState[currentState]["type"] == "penalty_american_football" &&
    gameState[currentState]["decision"]
  )
    $("#yard").text(gameState[currentState]["decision"]["text"]);
  if (gameState[currentState]["name"] == "Timeout over")
    $("#yard").text("Over");
  if (
    gameState[currentState]["type"] == "punt_result" &&
    gameState[currentState]["outcome"]
  ) {
    if (gameState[currentState]["outcome"]["text"] == "out_of_bounds")
      $("#yard").text("Out Of Bounds");
    if (gameState[currentState]["outcome"]["text"] == "fair_catch")
      $("#yard").text("Fair Catch");
    if (gameState[currentState]["outcome"]["text"] == "returned")
      $("#yard").text("Returned");
    if (gameState[currentState]["outcome"]["text"] == "touchback")
      $("#yard").text("Touchback");
  }
}
function stepInitialize() {
  t = 0;
  if (!gameState.length) return;
  x1 = x2;
  y1 = y2;
  if (currentState > gameState.length - 2) return;
  currentState = max(currentState + 1, gameState.length - 10);
  currentState = min(currentState, gameState.length - 1);
  setGameState();
  setYard();
  x_1_1 = mapX(x1, y1);
  y_1_1 = mapY(x1, y1);
  x_1_2 = mapX(x2, y2);
  y_1_2 = mapY(x2, y2);
  if (gameState[currentState]["team"] == "home") {
    $("#homeHelmet1").attr("fill", "#" + homePlayerColor);
    $("#awayHelmet1").attr("fill", "none");
    // $('#homePossession').attr('fill-opacity', 0.7)
    $("#awayPossession").attr("fill-opacity", 0);
    // $('#homePossession').attr('points', '177, 216 ' + 117 + 506 / 100 * gameState[currentState]["drive"]["yards"] + ', 216 730, 412 70, 412')
    if (gameState[currentState]["drive"]) {
      $("#homeLine").attr(
        "x1",
        177 + (446 / 100) * gameState[currentState]["drive"]["yardline"]
      );
      $("#homeLine").attr(
        "x2",
        70 + (660 / 100) * gameState[currentState]["drive"]["yardline"]
      );
      $("#awayLine").attr("x1", -100);
      $("#awayLine").attr("x2", -100);
      $("#homeLine").attr("stroke", "#" + homePlayerColor);
    }
  }
  if (gameState[currentState]["team"] == "away") {
    $("#awayHelmet1").attr("fill", "#" + awayPlayerColor);
    $("#homeHelmet1").attr("fill", "none");
    $("#homePossession").attr("fill-opacity", 0);
    // $('#awayPossession').attr('fill-opacity', 0.7)
    if (gameState[currentState]["drive"]) {
      $("#awayLine").attr(
        "x1",
        177 + (446 / 100) * gameState[currentState]["drive"]["yardline"]
      );
      $("#awayLine").attr(
        "x2",
        70 + (660 / 100) * gameState[currentState]["drive"]["yardline"]
      );
      $("#homeLine").attr("x1", -100);
      $("#homeLine").attr("x2", -100);
      $("#awayLine").attr("stroke", "#" + awayPlayerColor);
    }
  }
}
function showState() {
  if (gameState[currentState]["type"] == "goal") {
    setCenterFrame(goaltype, teamNames[gameState[currentState]["team"]]);
    if (goaltype == "")
      setCenterFrame("Goal", teamNames[gameState[currentState]["team"]]);
  } else if (gameState[currentState]["type"] == "tv_timeout_start") {
    setCenterFrame("TV Time Out", homeScore + "-" + awayScore);
  } else if (gameState[currentState]["type"] == "tv_timeout_stop") {
    setCenterFrame("TV Time Out", homeScore + "-" + awayScore);
  } else if (gameState[currentState]["type"] == "timeout") {
    setCenterFrame("Time Out", homeScore + "-" + awayScore);
  } else resetCenterFrame();

  if (gameState[currentState]["points"] == 0) {
    goaltype = "Extra point blocked";
    setCenterFrame(goaltype, teamNames[gameState[currentState]["team"]]);
  }
  if (gameState[currentState]["points"] == 1) {
    goaltype = "1 Extra point";
    setCenterFrame(goaltype, teamNames[gameState[currentState]["team"]]);
  }
  if (gameState[currentState]["points"] == 2) {
    goaltype = "2 Extra point";
    setCenterFrame(goaltype, teamNames[gameState[currentState]["team"]]);
  }
  if (gameState[currentState]["points"] == 3) {
    goaltype = "Field goal";
    setCenterFrame(goaltype, teamNames[gameState[currentState]["team"]]);
  }
  if (gameState[currentState]["points"] == 6) {
    goaltype = "touchdown";
    setCenterFrame(goaltype, teamNames[gameState[currentState]["team"]]);
  }

  if (match && match["status"]["name"] == "Ended") {
    //Match End
    setCenterFrame("Match End", homeScore + " : " + awayScore);
  }
  if (match && match["status"]["name"] == "Break") {
    //Break time
    setCenterFrame("Break", homeScore + " : " + awayScore);
  }
  if (match && match["p"] == 1) {
    $("#period").text("1st Quarter");
  }
  if (match && match["p"] == 2) {
    $("#period").text("2nd Quarter");
  }
  if (match && match["p"] == 3) {
    $("#period").text("3rd Quarter");
  }
  if (match && match["p"] == 4) {
    $("#period").text("4th Quarter");
  }
  if (match && match["p"] == 0) {
    $("#period").text("Ended");
    setCenterFrame("Match End", homeScore + ":" + awayScore);
    $("#gameState").text("");
    $("#yard").text("");
  }
  if (match && match["p"] == 31) {
    setTimer = false;
    setCenterFrame("Break", homeScore + ":" + awayScore);
    $("#period").text("Break");
    $("#gameState").text("");
    $("#yard").text("");
  }
  if (match && match["p"] == 32) {
    setTimer = false;
    setCenterFrame("Half time", homeScore + ":" + awayScore);
    $("#period").text("Half time");
    $("#gameState").text("");
    $("#yard").text("");
  }
  if (match && match["p"] == 33) {
    setTimer = false;
    setCenterFrame("Break", homeScore + ":" + awayScore);
    $("#period").text("Break");
    $("#gameState").text("");
    $("#yard").text("");
  }
}
var dob = 0;
var gameState = new Array();
var gameType = new Array();
var newEvents = new Array();
var lastEvents = new Array();
var awayteamname, hometeamname;
var homeScore, awayScore, periodlength, getDataTime;
var teamNames = new Array();
var periodScoreH = new Array();
var periodScoreA = new Array();
const equals = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// New function added for websocket.
function handleEventData(data) {
  /*
    data.info   => (matchinfo)
    data.match    => match (match_timelinedelta)
    data.events   => events (match_timelinedelta)
  */

  if (data.info) {
    handleInfoData(data);
  }

  match = data["match"];

  if (match) {
    if (match["timeinfo"]) {
      played = match["timeinfo"]["played"];
    }
    if (match["status"]["name"] == "Interrupted") {
      isLimitedCov = true;
    } else isLimitedCov = false;
    if (match["status"]["name"].includes("home")) currentBatTeam = "home";
    if (match["status"]["name"].includes("away")) currentBatTeam = "away";
    if (currentBatTeam == "home") {
      $("#pitchImage").attr("href", "./media/pitch.png");
      $("#batState").attr("transform", "translate(0, 0)");
      $("#bowlState").attr("transform", "translate(0, 0)");
    }
    if (currentBatTeam == "away") {
      $("#pitchImage").attr("href", "./media/pitch1.png");
      $("#batState").attr("transform", "translate(400, 0)");
      $("#bowlState").attr("transform", "translate(-400, 0)");
    }
    // if(match['type'] == 'periodscore' ){
    //   isperiodscore = true
    // }
    // else isperiodscore = false
    bestofsets = match["bestofsets"];
    var teams = match["teams"];
    periodlength = match["periodlength"];
    var hometeam = teams["home"];
    if (hometeam["name"]) hometeamname = hometeam["name"];
    var awayteam = teams["away"];
    if (awayteam["name"]) awayteamname = awayteam["name"];
    teamNames["home"] = hometeamname;
    teamNames["away"] = awayteamname;
    // hometeamname = 'This team name is longer than 19 characters'

    if (hometeamname.length > 15) {
      teamNames["home"] = hometeamname.substr(0, 13) + "...";
    }
    if (awayteamname.length > 15) {
      teamNames["away"] = awayteamname.substr(0, 13) + "...";
    }
    document.getElementById("headerHome").textContent = teamNames["home"];
    document.getElementById("headerAway").textContent = teamNames["away"];
    document.getElementById("stateHome").textContent = teamNames["home"];
    document.getElementById("stateAway").textContent = teamNames["away"];
    // document.getElementById('period').textContent = capitalizeWords(match['status']['name'].split(" ")).join(' ')
    // Score Setting
    var result = match["result"];
    if (result["home"] > -1) homeScore = result["home"];
    if (result["away"] > -1) awayScore = result["away"];
    $("#score").text(homeScore + "-" + awayScore);
    $("#homeTscore").text(homeScore);
    $("#awayTscore").text(awayScore);
    // Period score begin
    periodScores = match["periods"];
    homePeriodScore = 0;
    awayPeriodScore = 0;
    currentPeriod = 0;
    if (periodScores) {
      if (periodScores["p1"]) {
        $("#home1score").text(periodScores["p1"]["home"]);
        $("#away1score").text(periodScores["p1"]["away"]);
        homePeriodScore += periodScores["p1"]["home"];
        awayPeriodScore += periodScores["p1"]["away"];
        currentPeriod = 1;
      } else {
        $("#home1score").text(homeScore);
        $("#away1score").text(awayScore);
      }
      if (periodScores["p2"]) {
        $("#home2score").text(periodScores["p2"]["home"]);
        $("#away2score").text(periodScores["p2"]["away"]);
        homePeriodScore += periodScores["p2"]["home"];
        awayPeriodScore += periodScores["p2"]["away"];
        currentPeriod = 2;
      } else if (currentPeriod == 1) {
        $("#home2score").text(homeScore - homePeriodScore);
        $("#away2score").text(awayScore - awayPeriodScore);
      }
      if (periodScores["p3"]) {
        $("#home3score").text(periodScores["p3"]["home"]);
        $("#away3score").text(periodScores["p3"]["away"]);
        homePeriodScore += periodScores["p3"]["home"];
        awayPeriodScore += periodScores["p3"]["away"];
        currentPeriod = 3;
      } else if (currentPeriod == 2) {
        $("#home3score").text(homeScore - homePeriodScore);
        $("#away3score").text(awayScore - awayPeriodScore);
      }
      if (periodScores["p4"]) {
        $("#home4score").text(periodScores["p4"]["home"]);
        $("#away4score").text(periodScores["p4"]["away"]);
        homePeriodScore += periodScores["p4"]["home"];
        awayPeriodScore += periodScores["p4"]["away"];
        currentPeriod = 4;
      } else if (currentPeriod == 3) {
        $("#home4score").text(homeScore - homePeriodScore);
        $("#away4score").text(awayScore - awayPeriodScore);
      }
    }

    // Period score end

    if (match["status"]["name"] == "Not started") {
      //Match End
      const currentDate = new Date();
      upCommingTime = currentDate.getTime() / 1000 - match["updated_uts"];
      // var seconds = Math.floor(updated_uts / 1000)
      var seconds = Math.floor(upCommingTime);
      var minute = Math.floor(seconds / 60);
      var second = seconds % 60;
      // var date = new Date(match['_dt']['date'] + '4:52:48 PM UTC');
      var matchDate = match["_dt"]["date"].split("/");
      var date = new Date(
        matchDate[1] +
          "/" +
          matchDate[0] +
          "/20" +
          matchDate[2] +
          " " +
          match["_dt"]["time"] +
          ":00 UTC"
      );

      matchStartDate = date.getTime();
    }
    isRunning = true;
    if (match["status"]["name"] == "Ended") {
      //Match End
      setCenterFrame("Match End", homeScore + " : " + awayScore);
      isRunning = false;
      if (match["status"]["name"] == "Ended") {
        $("#gameState").text("Match End");
      }
      if (match["status"]["name"] == "Ended") {
        $("#yard").text("Winner: " + teamNames[match["result"]["winner"]]);
      }
    }
    if (match["status"]["name"] == "Break") {
      //Break time
      setCenterFrame("Break", homeScore + " : " + awayScore);
      isRunning = false;
    }
    if (match["p"] == 1) {
      $("#period").text("1st Quarter");
    }
    if (match["p"] == 2) {
      $("#period").text("2nd Quarter");
    }
    if (match["p"] == 3) {
      $("#period").text("3rd Quarter");
    }
    if (match["p"] == 4) {
      $("#period").text("4th Quarter");
    }
    if (match["p"] == 0) {
      $("#period").text("END");
    }
    if (match["p"] == 31) {
      setTimer = false;
      setCenterFrame("Break", homeScore + ":" + awayScore);
      $("#period").text("Break");
      isRunning = false;
    }
    if (match["p"] == 32) {
      setTimer = false;
      setCenterFrame("Halftime", homeScore + ":" + awayScore);
      $("#period").text("Halftime");
      isRunning = false;
    }
    if (match["p"] == 33) {
      setTimer = false;
      setCenterFrame("Break", homeScore + ":" + awayScore);
      $("#period").text("Break");
      isRunning = false;
    }
  }

  var events = data["events"] || {};

  var newEvents = new Array();
  Object.values(events).forEach((event) => {
    if (event["type"] != "timeinfo" && event["type"] != "timerunning") {
      newEvents.push(event);
    }
  });
  newEvents.forEach((newEvent) => {
    let flag = 1;
    gameState.forEach((lastEvent) => {
      if (equals(newEvent, lastEvent)) flag = 0;
    });
    if (flag == 1) {
      gameState.push(newEvent);
    }
  });
  lastEvents = newEvents;
}
function handleInfoData(data) {
  var data1 = data.info;
  var jerseys = data1["jerseys"];
  homePlayerColor = jerseys["home"]["player"]["base"];
  awayPlayerColor = jerseys["away"]["player"]["base"];
  $("#homeHelmet").attr("fill", "#" + homePlayerColor);
  $("#awayHelmet").attr("fill", "#" + awayPlayerColor);
  // $('#homeHelmet1').attr('fill', '#' + homePlayerColor)
  // $('#awayHelmet1').attr('fill', '#' + awayPlayerColor)
}
function changeScreenSize() {
  screenHeight = window.innerHeight;
  screenWidth = window.innerWidth;

  scale = min(screenWidth / 800, screenHeight / 425);

  document
    .getElementById("scale")
    .setAttribute("transform", "scale(" + scale + ")");
  document.getElementById("svg").setAttribute("width", 800 * scale);
  document.getElementById("svg").setAttribute("height", 425 * scale);
}
function min(a, b) {
  if (a > b) return b;
  return a;
}
function toggleViewMode() {
  $("#viewMode").text(viewMode + "D");
  if (viewMode == 3) {
    viewMode = 2;
  } else if (viewMode == 2) {
    viewMode = 3;
  }
  $("#pitchImage").attr("href", "./media/pitch" + viewMode + "d.png");
}
