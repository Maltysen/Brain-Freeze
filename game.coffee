cards = common = null
score = 0
socket = io()
in_pregame = false
game_id = null
timer = null

$("#pregame").hide()
$("#game").hide()
$("#postgame").hide()
$("#start-game").hide()

$("#id-form").submit((e) ->
    game_id = $("#game-id").val()

    socket.on("pregame update", (players) ->
            $("#players").html(("<li id='#{player[0]}-score'>#{player[1]}<span class='score'> - </span><span class='score' id='#{player[0]}'>0</span></li>" for player in players).join "\n")
            $("##{socket.id}-score").css("background", "rgba(0, 125, 255, 0.3)")
            $(".score").hide()

            if players.length == 1
                $("#start-game").show()

                $("#start-game").click((e) -> socket.emit("start game", {id: game_id}))
    )

    socket.on("game started", (data) ->
        #$("#pregame").hide()
        $("#start-game").hide()
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
        $("#pregame").hide()
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

    socket.emit("join game", {name: $("#name").val(), id: $("#game-id").val()})

    $("#signup").hide()
    $("#pregame").show()

    return false
)

###
#canvas = $("#disp")[0].getContext "2d"
#canvas.font = "30px Arial"
###
