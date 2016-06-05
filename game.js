(function() {
  var CHARS, COLORS, cards, check, ding, first_pregame, game_id, in_pregame, master, num, players, playing, socket, timer,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  cards = null;

  socket = io();

  in_pregame = false;

  game_id = null;

  timer = null;

  first_pregame = true;

  master = false;

  players = null;

  playing = true;

  num = -1;

  ding = new Audio("ding.wav");

  check = function(pressed) {
    if (playing) {
      if (__indexOf.call(cards[0].concat(cards[1]), pressed) >= 0) {
        return socket.emit("check answer", {
          id: game_id,
          answer: pressed,
          num: num
        });
      }
    }
  };

  COLORS = ["green", "red", "black", "SaddleBrown", "purple", "blue"];

  CHARS = "GAZH5C2O8I0W3VRJKLPFBN4U7YT91EDMXQ6S";

  window.init_game = function() {
    $("#pregame").hide();
    $("#game").hide();
    $("#postgame").hide();
    $("#start-game").hide();
    $("#signup").show();
    $("#name").focus().select();
    return first_pregame = true;
  };

  $("[rel=tooltip]").tooltip({
    placement: 'right'
  });

  init_game();

  $("#id-form").submit(function(e) {
    game_id = $("#game-id").val() || socket.id.replace(/[^0-9]/g, '');
    socket.emit("join game", {
      name: $("#name").val(),
      id: game_id
    });
    return false;
  });

  socket.on("pregame update", function(data) {
    var info, player;
    if (first_pregame) {
      master = data.master === socket.id;
      $("#invite").val(document.location.origin + document.location.pathname + ("?game_id=" + game_id));
      $("#signup").hide();
      $("#pregame").show();
      $(window).on('beforeunload', function(e) {
        socket.emit("stopping", game_id);
        return "A game is in progress.";
      });
      if (master) {
        $("#start-game").show();
        $("#start-game").click(function(e) {
          return socket.emit("start game", {
            id: game_id
          });
        });
        if (!$("#game-id").val()) {
          $("#start-game").click();
        }
      }
      first_pregame = false;
    }
    $("#players").html(((function() {
      var _ref, _results;
      _ref = data.players;
      _results = [];
      for (player in _ref) {
        info = _ref[player];
        _results.push("<li class='player' id='" + player + "'>" + info.name + "</li>");
      }
      return _results;
    })()).join("\n"));
    return $("#" + socket.id).addClass("you");
  });

  socket.on("game started", function(data) {
    var info, player;
    $("#scores").html(((function() {
      var _ref, _results;
      _ref = data.players;
      _results = [];
      for (player in _ref) {
        info = _ref[player];
        _results.push("<li class='player' id='" + player + "-score-disp'>" + info.name + "<h1 id='" + player + "-score'>0</h1></li>");
      }
      return _results;
    })()).join("\n"));
    $("#" + socket.id + "-score-disp").addClass("you");
    $("#pregame").hide();
    $("#game").show();
    timer = new Tock({
      countdown: true,
      interval: 100,
      callback: function() {
        return $("#timer").text(timer.msToTimecode(timer.lap()).slice(4));
      },
      complete: master ? function() {
        return socket.emit("stop", {
          id: game_id
        });
      } : function() {}
    });
    timer.start("{{ time }}");
    return $("body").keyup(function(e) {
      if (!event.metaKey) {
        return check(String.fromCharCode(e.keyCode));
      }
    });
  });

  socket.on("game update", function(data) {
    if (data.changed) {
      $("#" + data.changed + "-score").text(data.players[data.changed].score);
      if (data["new"]) {
        $("#" + data.changed + "-score-disp").addClass(data.changed === socket.id ? "correctSelf" : "correctOther");
        setTimeout(function() {
          return $("#" + data.changed + "-score-disp").removeClass(data.changed === socket.id ? "correctSelf" : "correctOther");
        }, 1400);
      } else {
        $("#" + data.changed + "-score-disp").addClass("wrong");
        setTimeout(function() {
          return $("#" + data.changed + "-score-disp").removeClass("wrong");
        }, 900);
      }
      if (data.changed === socket.id) {
        if (data["new"]) {
          4;
        } else {
          3;
        }
      }
    }
    if (data["new"]) {
      num = data.num;
      cards = data.cards;
      timer.pause();
      $(".answer").addClass("circled");
      playing = false;
      return setTimeout(function() {
        var card, char, n;
        for (n in cards) {
          card = cards[n];
          $("#card" + n).html(((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = card.length; _i < _len; _i++) {
              char = card[_i];
              _results.push("<h1 class='char " + (char === data.answer ? "answer" : "") + "' style='color: " + COLORS[CHARS.indexOf(char) % COLORS.length] + "'>" + char + "</h1>");
            }
            return _results;
          })()).join("\n"));
          $(".char").click(function(e) {
            return check($(e.target).text());
          });
        }
        playing = true;
        return timer.pause();
      }, data.changed ? 1500 : 0);
    }
  });

  socket.on("stopped", function(data) {
    var player;
    $("#winners").html(((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        player = data[_i];
        _results.push("<li>" + player.name + " - " + player.score + " points</li>");
      }
      return _results;
    })()).join("\n"));
    $(window).unbind();
    $("#game").hide();
    $("#player-cont").hide();
    return $("#postgame").show();
  });

  socket.on("too late", function(e) {
    return alert("Game already started");
  });

}).call(this);
