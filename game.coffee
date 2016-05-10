cards = null
socket = io()
in_pregame = false
game_id = null
timer = null
first_pregame = true
master = false
players = null
playing = true
num = -1

check = (pressed) ->
    if playing
        if pressed in cards[0].concat(cards[1])
            socket.emit("check answer", {id: game_id, answer: pressed, num: num})

COLORS = ["green", "red", "black", "SaddleBrown", "purple", "blue"]
CHARS = "GAZH5C2O8I0W3VRJKLPFBN4U7YT91EDMXQ6S"

window.init_game = () ->
    $("#pregame").hide()
    $("#game").hide()
    $("#postgame").hide()
    $("#start-game").hide()
    $("#signup").show()
    $("#name").focus().select()
    first_pregame = true

$("[rel=tooltip]").tooltip({ placement: 'right'});
init_game()

$("#id-form").submit((e) ->
    game_id = $("#game-id").val() or (socket.id).replace(/[^0-9]/g, '')

    socket.emit("join game", {name: $("#name").val(), id: game_id})
    false
)

socket.on("pregame update", (data) ->
        if first_pregame
            master = data.master is socket.id

            $("#invite").val(document.location.origin + document.location.pathname + "?game_id=#{game_id}")

            $("#signup").hide()
            $("#pregame").show()

            $(window).on('beforeunload', (e) ->
                socket.emit("stopping", game_id)
                "A game is in progress."
            )

            if master
                $("#start-game").show()
                $("#start-game").click((e) -> socket.emit("start game", {id: game_id}))
                if not $("#game-id").val()
                    $("#start-game").click()

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

    timer.start("{{ time }}")

    $("body").keyup((e) ->
        if not event.metaKey
            check(String.fromCharCode(e.keyCode))
    )
)

socket.on("game update", (data) ->
    if data.changed
        $("##{data.changed}-score").text(data.players[data.changed].score)
        if data.new
            $("##{data.changed}-score-disp").addClass(if data.changed is socket.id then "correctSelf" else "correctOther")
            setTimeout(() ->
                $("##{data.changed}-score-disp").removeClass(if data.changed is socket.id then "correctSelf" else "correctOther")
            , 1400)
        else
            $("##{data.changed}-score-disp").addClass("wrong")
            setTimeout(() ->
                $("##{data.changed}-score-disp").removeClass("wrong")
            , 900)

    if data.new
        num = data.num
        cards = data.cards

        timer.pause()
        $(".answer").addClass("circled")
        playing = false
        setTimeout(() ->
            for n, card of cards
                $("#card#{n}").html(("<h1 class='char #{if char == data.answer then "answer" else ""}' style='color: #{COLORS[CHARS.indexOf(char) % COLORS.length]}'>#{char}</h1>" for char in card).join("\n"))
                $(".char").click((e) ->
                    check($(e.target).text())
                )
            playing = true
            timer.pause()
        , if data.changed then 1500 else 0)
)

socket.on("stopped", (data) ->
    $("#winners").html(("<li>#{player.name} - #{player.score} points</li>" for player in data).join("\n"))

    $(window).unbind()
    $("#game").hide()
    $("#player-cont").hide()
    $("#postgame").show()
)

socket.on("too late", (e) ->
    alert("Game already started")
)
