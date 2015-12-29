from flask import Flask, render_template, request, Response, jsonify, make_response
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
import string, random, time, os, base64
from memcache import Client
from threading import Timer

NUM_EACH = 7
NUM_CARDS = 2

app = Flask(__name__, template_folder='.', static_folder='.')
app.config['SECRET_KEY'] = 'secret!'
mc = Client(['127.0.0.1:11211'], debug=0)
socketio = SocketIO(app)

@app.route('/')
def root():
    return render_template("index.html")

@socketio.on('join game')
def join_game(data):
    game_id = data["id"]
    master = False

    game = mc.get(game_id)
    if not game:
        master = True
        game = [[request.sid, data["name"]]]
        mc.add(game_id, game)
    elif game == -1:
        emit("too late")
        return
    else:
        game += [[request.sid, data["name"]]]
        mc.set(game_id, game)

    #mc.add(request.cookies["playerId"], 0)

    join_room(game_id)
    emit("pregame update", game, room = game_id)

@socketio.on('start game')
def start_game(data):
    game_id = data["id"]
    game = mc.get(game_id)

    if game[0][0] == request.sid:
        mc.set(game_id, -1)
        emit("game started", room = game_id)
        emit("game update", gen_cards(), room = game_id)
        Timer(30, stop_game, [game_id]).start()

@socketio.on('disconnect')
def disconnection():
    stop_game(rooms()[1])

@socketio.on('stopping')
def stopping(game_id):
    stop_game(game_id)

def stop_game(game_id):
    mc.delete(game_id)
    socketio.emit("game stopped", room = game_id)
    socketio.close_room(game_id)

@socketio.on('correct')
def correct(data):
    game_id = data["id"]

    emit("game update", gen_cards(), room = game_id)
    emit("score update", {"player": request.sid, "new": data["score"] + 1}, room = game_id)

@socketio.on('wrong')
def correct(data):
    game_id = data["id"]

    emit("score update", {"player": request.sid, "new": data["score"] - 1}, room = game_id)

def gen_cards():
    pool = set(string.ascii_uppercase + string.digits)

    common = random.choice(list(pool))
    cards = [[common] for i in range(NUM_CARDS)]
    pool -= {common}

    for card in cards:
        for i in range(NUM_EACH):
            card += [random.choice(list(pool))]
            pool -= {card[-1]}

    list(map(random.shuffle, cards))

    return {"cards": cards, "common": common}

@app.route('/<path>')
def other(path):
    return app.send_static_file(path)

if __name__ == '__main__':
    socketio.run(app=app, debug=True, host="0.0.0.0")
