(function() {
  var cards, common, game_id, in_pregame, score, socket, timer,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  cards = common = null;

  score = 0;

  socket = io();

  in_pregame = false;

  game_id = null;

  timer = null;

  $("#pregame").hide();

  $("#game").hide();

  $("#postgame").hide();

  $("#start-game").hide();

  $("#id-form").submit(function(e) {
    game_id = $("#game-id").val();
    socket.on("pregame update", function(players) {
      var player;
      $("#players").html(((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = players.length; _i < _len; _i++) {
          player = players[_i];
          _results.push("<li id='" + player[0] + "-score'>" + player[1] + "<span class='score'> - </span><span class='score' id='" + player[0] + "'>0</span></li>");
        }
        return _results;
      })()).join("\n"));
      $("#" + socket.id + "-score").css("background", "rgba(0, 125, 255, 0.3)");
      $(".score").hide();
      if (players.length === 1) {
        $("#start-game").show();
        return $("#start-game").click(function(e) {
          return socket.emit("start game", {
            id: game_id
          });
        });
      }
    });
    socket.on("game started", function(data) {
      $("#start-game").hide();
      $("#game").show();
      $(".score").show();
      timer = new Tock({
        countdown: true,
        interval: 100,
        callback: function() {
          return $("#timer").text(timer.msToTimecode(timer.lap()).slice(4));
        }
      });
      timer.start($("#timer").text());
      return $("body").keyup(function(e) {
        var pressed;
        pressed = String.fromCharCode(e.keyCode);
        if (__indexOf.call(cards[0].concat(cards[1]), pressed) >= 0 && !event.metaKey) {
          if (pressed === common) {
            score += 1;
            return socket.emit("correct", {
              id: game_id,
              score: parseInt($("#" + socket.id).text())
            });
          } else if (score) {
            socket.emit("wrong", {
              id: game_id,
              score: parseInt($("#" + socket.id).text())
            });
            return score -= 1;
          }
        }
      });
    });
    socket.on("game stopped", function(data) {
      socket.disconnect();
      $("#game").hide();
      $("#pregame").hide();
      return $("#postgame").show();
    });
    socket.on("game update", function(data) {
      cards = data.cards, common = data.common;
      $("#card1").text(cards[0]);
      return $("#card2").text(cards[1]);
    });
    socket.on("score update", function(data) {
      return $("#" + data.player).text(data["new"]);
    });
    socket.emit("join game", {
      name: $("#name").val(),
      id: $("#game-id").val()
    });
    $("#signup").hide();
    $("#pregame").show();
    return false;
  });


  /*
   *canvas = $("#disp")[0].getContext "2d"
   *canvas.font = "30px Arial"
   */

}).call(this);
