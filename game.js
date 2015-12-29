(function() {
  var bound, cards, common, game_id, in_pregame, score, socket, timer,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  cards = common = null;

  score = 0;

  socket = io();

  in_pregame = false;

  game_id = null;

  timer = null;

  bound = false;

  $("#pregame").hide();

  $("#players-cont").hide();

  $("#game").hide();

  $("#postgame").hide();

  $("#start-game").hide();

  $("#id-form").submit(function(e) {
    game_id = $("#game-id").val();
    if (!bound) {
      socket.on("pregame update", function(players) {
        var player;
        $("#signup").hide();
        $("#pregame").show();
        $("#players-cont").show();
        $("#players").html(((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = players.length; _i < _len; _i++) {
            player = players[_i];
            _results.push("<li class='player' id='" + player[0] + "-score'>" + player[1] + "<h1 class='score' id='" + player[0] + "'>0</h1></li>");
          }
          return _results;
        })()).join("\n"));
        $("#" + socket.id + "-score").addClass("you");
        $(".score").hide();
        if (players.length === 1) {
          $("#start-game").show();
          $("#start-game").click(function(e) {
            return socket.emit("start game", {
              id: game_id
            });
          });
        }
        if (players[players.length - 1][0] === socket.id) {
          return $(window).on('beforeunload', function(e) {
            socket.emit("stopping", game_id);
            return "A game is in progress.";
          });
        }
      });
      socket.on("game started", function(data) {
        $("#pregame").hide();
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
        $("#player-cont").hide();
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
      socket.on("too late", function(e) {
        bound = true;
        return alert("Game already started");
      });
    }
    socket.emit("join game", {
      name: $("#name").val(),
      id: $("#game-id").val()
    });
    return false;
  });


  /*
   *canvas = $("#disp")[0].getContext "2d"
   *canvas.font = "30px Arial"
   */

}).call(this);
