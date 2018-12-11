from collections import Counter, defaultdict
import csv
import flask
from flask_cors import CORS
import numpy as np
app = flask.Flask(__name__)
CORS(app)

# Load games into a useful data structure in memory
games = {}
with open('./game_data.csv', 'rb') as csvFile:
    gameDataReader = csv.reader(csvFile)
    gameDataReader.next()

    for row in gameDataReader:
        game = row[0]
        player = int(row[1])
        move = int(row[2]) - 1
        column = int(row[3])
        result = row[4]

        if game not in games:
            games[game] = {
                'players': set(),
                'moves': {}
            }

        games[game]['players'].add(player)
        games[game]['moves'][move] = (player, column)

        if result:
            if result == 'win':
                games[game]['winner'] = player
                games[game]['draw'] = False
            else:
                games[game]['draw'] = True

            # Have to convert the players set to a list so it is JSON serializable
            games[game]['players'] = list(games[game]['players'])

# Load user metadata
userMetadata = {}
eloRatingsByNat = defaultdict(list)

metadataFields = ['userId', 'gender', 'nat', 'city', 'state', 'postcode', 'eloRating', 'ranking']
with open('./user_data.csv', 'rb') as csvFile:
    reader = csv.DictReader(csvFile, metadataFields)
    reader.next()

    for row in reader:
        userMetadata[row['userId']] = row
        # Add userId to dict of users by nationality
        if row['eloRating']:
            eloRatingsByNat[row['nat']].append(int(row['eloRating']))

# Compute stats over eloRating by nationality
statsByNat = {}

for nat in eloRatingsByNat:
    statsByNat[nat] = {
        'nat': nat,
        'eloRating': {
            'samples': len(eloRatingsByNat[nat]),
            'min': min(eloRatingsByNat[nat]),
            'max': max(eloRatingsByNat[nat]),
            'median': np.median(eloRatingsByNat[nat]),
            'mean': np.mean(eloRatingsByNat[nat]),
            'std': np.std(eloRatingsByNat[nat])
        }
    }

# Compute results for each player
resultsByPlayer = defaultdict(Counter)

for gameNum in games:
    game = games[gameNum]
    player1 = str(game['moves'][0][0])
    player2 = str(game['moves'][1][0])

    if game['draw']:
        for player in game['players']:
            resultsByPlayer[str(player)]['draw'] += 1
    elif str(game['winner']) == player1:
        resultsByPlayer[player1]['win'] += 1
        resultsByPlayer[player2]['lose'] += 1
    else:
        resultsByPlayer[player2]['win'] += 1
        resultsByPlayer[player1]['lose'] += 1

    resultsByPlayer[player1]['played'] += 1
    resultsByPlayer[player2]['played'] += 1

playerData = {}
for userId in userMetadata:
    playerData[userId] = {
        'metadata': userMetadata[userId],
        'results': resultsByPlayer[userId]
    }

# Collect results by move sequence
resultsByMoves = defaultdict(Counter)

for gameNum in games:
    game = games[gameNum]
    startingPlayer = game['moves'][0][0]

    for i in range(0, len(game['moves'])):
        moves = [game['moves'][j][1] for j in range(0,i)]
        movesKey = tuple(moves)

        if game['draw']:
            resultsByMoves[movesKey]['draw'] += 1
        elif game['winner'] == startingPlayer:
            resultsByMoves[movesKey]['win'] += 1
        else:
            resultsByMoves[movesKey]['lose'] += 1

@app.route("/games")
def get_games():
    # Return a JSON data structure of all games
    return flask.json.jsonify(games)

@app.route("/games/<game_id>")
def get_game(game_id):
    # Return a JSON data structure describing a single game by ID
    return flask.json.jsonify(games[game_id])

@app.route("/players")
def get_players():
    # Return a JSON data structure of all players
    return flask.json.jsonify(playerData)

@app.route("/players/<player_id>")
def get_player(player_id):
    # Return a JSON data structure of a single player's stats by ID
    return flask.json.jsonify(playerData[player_id])

@app.route("/stats")
def get_stats():
    # Return a JSON data structure of a single player's stats by ID
    return flask.json.jsonify(statsByNat)

@app.route("/stats/<nat>")
def get_stats_by_nat(nat):
    # Return a JSON data structure of a single player's stats by ID
    return flask.json.jsonify(statsByNat[nat])

@app.route("/results")
def get_results():
    # Get results by passing in a query param, "moves", like this:
    # /results?moves=1,2,3,4
    moves = flask.request.args.get('moves')
    movesKey = tuple([int(move) for move in moves.split(',')])
    return flask.json.jsonify(resultsByMoves[movesKey])
