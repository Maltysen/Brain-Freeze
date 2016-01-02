cards = null
socket = io()
in_pregame = false
game_id = null
timer = null
join_bound = false
first_pregame = true
master = false
players = null
num = -1

COLORS = ["green", "red", "black", "orange", "purple", "blue"]
CHARS = "GAZH5C2O8I0W3VRJKLPFBN4U7YT91EDMXQ6S"

$("#pregame").hide()
$("#game").hide()
$("#postgame").hide()
$("#start-game").hide()

$("#id-form").submit((e) ->
    game_id = $("#game-id").val()

    if not join_bound
        socket.on("pregame update", (data) ->

                window.data=data

                if first_pregame
                    master = data.master is socket.id

                    $("#signup").hide()
                    $("#pregame").show()

                    $(window).on('beforeunload', (e) ->
                        socket.emit("stopping", game_id)
                        "A game is in progress."
                    )

                    if master
                        $("#start-game").show()
                        $("#start-game").click((e) -> socket.emit("start game", {id: game_id}))

                    first_pregame = false

                $("#players").html(("<li class='player' id='#{player}'>#{info.name}</li>" for player, info of data.players).join "\n")
                $("##{socket.id}").addClass("you")
        )

        socket.on("game started", (data) ->
            $("#scores").html(("<li class='player' id='#{player}-score-disp'>#{info.name}<h1 id='#{player}-score'>0</h1></li>" for player, info of data.players).join "\n")
            $("##{socket.id}-score-disp").addClass("you")

            $("#pregame").hide()
            $("#game").show()

            timer = new Tock({
                countdown: true,
                interval: 100,
                callback: () ->
                    $("#timer").text(timer.msToTimecode(timer.lap()).slice(4))
                complete: if master then () -> socket.emit("stop", {id: game_id}) else () ->
            })

            timer.start($("#timer").text())

            $("body").keyup((e) ->
                pressed = String.fromCharCode(e.keyCode)
                if pressed in cards[0].concat(cards[1]) and not event.metaKey
                    socket.emit("check answer", {id: game_id, answer: pressed, num: num})
            )
        )

        socket.on("game update", (data) ->
            $("##{data.changed}-score").text(data.players[data.changed].score)
            console.log data
            num = data.num
            cards = data.cards

            for n, card of cards
                $("#card#{n}").html(("<h1 class='char' style='color: #{COLORS[CHARS.indexOf(char) % COLORS.length]}'>#{char}</h1>" for char in card).join("\n"))
        )

        socket.on("stopped", (data) ->
            #winner = winner.data
            $(window).unbind()
            $("#game").hide()
            $("#player-cont").hide()
            $("#postgame").show()
        )

        socket.on("too late", (e) ->
            alert("Game already started")
        )

        join_bound = true

    socket.emit("join game", {name: $("#name").val(), id: $("#game-id").val()})

    return false
)

###
#canvas = $("#disp")[0].getContext "2d"
#canvas.font = "30px Arial"
###
