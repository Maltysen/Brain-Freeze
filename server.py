from flask import Flask, render_template, request, Response, jsonify, make_response, redirect, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms, close_room
import string, random, time, os, base64
from memcache import Client
from threading import Timer

NUM_EACH = 9
NUM_CARDS = 2
GAME_LENGTH = "3:00"

app = Flask(__name__, template_folder='.', static_folder='.')
app.config['SECRET_KEY'] = 'secret!'
mc = Client(['127.0.0.1:11211'], debug=0)
socketio = SocketIO(app)

@app.route('/')
def root():
    return render_template("index.html", name = request.args.get("name", ""), game_id = request.args.get("game_id", ""))

@socketio.on('join game')
def join_game(data):
    game_id = data["id"]
    master = False

    game = mc.get(game_id)
    if not game:
        master = True
        game = {"players": {
            request.sid: {
                "name":data["name"], "score": 0
            }
        }, "started": 0, "master": request.sid, "num": -1, "answer": "", "changed": ""}

        mc.add(game_id, game)
        close_room(game_id)
    elif game["started"]:
        emit("too late")
        return
    else:
        game["players"][request.sid] = {"name": data["name"], "score": 0}
        mc.set(game_id, game)

    join_room(game_id)
    emit("pregame update", game, room = game_id)

@socketio.on('start game')
def start_game(data):
    game_id = data["id"]
    game = mc.get(game_id)

    if game["master"] == request.sid:
        game["started"] = 1
        emit("game started", game, room = game_id)

        game["num"] += 1
        game["new"] = True

        cards = gen_cards()
        game["answer"] = cards[1]
        mc.set(game_id, game)

        game["cards"] = cards[0]

        emit("game update", game, room = game_id)

@socketio.on("check answer")
def update_score(data):
    game_id = data["id"]
    game = mc.get(game_id)
    print(data)
    if game["num"] == int(data["num"]):
        correct = data["answer"] == game["answer"]
        game["players"][request.sid]["score"] = max(0, game["players"][request.sid]["score"] + (10 if correct else -5))
        game["changed"] = request.sid
        game["new"] = data["answer"] == game["answer"]
        if correct:
            game["num"] += 1
            cards = gen_cards()
            game["answer"] = cards[1]
        mc.set(game_id, game)

        if correct:
            game["cards"] = cards[0]

        emit("game update", game, room = game_id)

@socketio.on('stop')
def stop_game(data):
    game_id = data["id"]
    game = mc.get(game_id)
    players = game["players"]
    players = sorted(players.values(), key = lambda x: x["score"], reverse = True)
    mc.delete(game_id)

    emit("stopped", players, room = game_id)
    socketio.close_room(game_id)

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

    return cards, common

@app.route('/game.js')
def game():
    return render_template("game.js", time=GAME_LENGTH)

@app.route('/flush')
def flush():
    mc.flush_all()
    return redirect('/?flushed')

@app.route('/<path>')
def other(path):
    return app.send_static_file(path)

if __name__ == '__main__':
    socketio.run(app=app, debug=True, host="0.0.0.0", use_reloader=True, port=80)
