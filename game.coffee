cards = common = null
score = 0
socket = io()
in_pregame = false
game_id = null
timer = null
bound = false

$("#pregame").hide()
$("#players-cont").hide()
$("#game").hide()
$("#postgame").hide()
$("#start-game").hide()

$("#id-form").submit((e) ->
    game_id = $("#game-id").val()

    if not bound
        socket.on("pregame update", (players) ->
                $("#signup").hide()
                $("#pregame").show()
                $("#players-cont").show()

                $("#players").html(("<li class='player' id='#{player[0]}-score'>#{player[1]}<h1 class='score' id='#{player[0]}'>0</h1></li>" for player in players).join "\n")
                $("##{socket.id}-score").addClass("you")
                $(".score").hide()

                if players.length == 1
                    $("#start-game").show()

                    $("#start-game").click((e) -> socket.emit("start game", {id: game_id}))

                if players[players.length - 1][0] == socket.id
                     $(window).on('beforeunload', (e) ->
                         socket.emit("stopping", game_id)

                         "A game is in progress."
                     )
        )

        socket.on("game started", (data) ->
            $("#pregame").hide()
            $("#game").show()
            $(".score").show()

            timer = new Tock({
                countdown: true,
                interval: 100,
                callback: () ->
                    $("#timer").text(timer.msToTimecode(timer.lap()).slice(4))
            })

            timer.start($("#timer").text())

            $("body").keyup((e) ->
                pressed = String.fromCharCode(e.keyCode)

                if pressed in cards[0].concat(cards[1]) and not event.metaKey
                    if pressed == common
                        score += 1
                        socket.emit("correct", {id: game_id, score: parseInt($("##{socket.id}").text())})
                    else if score
                        socket.emit("wrong", {id: game_id, score: parseInt($("##{socket.id}").text())})
                        score -= 1
            )
        )

        socket.on("game stopped", (data) ->
            socket.disconnect()
            $("#game").hide()
            $("#player-cont").hide()
            $("#postgame").show()
        )

        socket.on("game update", (data) ->
            {cards: cards, common: common} = data

            $("#card1").text(cards[0])
            $("#card2").text(cards[1])
        )

        socket.on("score update", (data) ->
            $("##{data.player}").text(data.new)
        )

        socket.on("too late", (e) ->
            bound = true
            alert("Game already started")
        )

    socket.emit("join game", {name: $("#name").val(), id: $("#game-id").val()})

    return false
)

###
#canvas = $("#disp")[0].getContext "2d"
#canvas.font = "30px Arial"
###
