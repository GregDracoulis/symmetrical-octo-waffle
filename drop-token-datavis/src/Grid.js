import React, { Component } from 'react';
import { Circle } from 'react-shapes';
import MoveStats from './MoveStats';

// Colors to use for each player
const colors = {
  1: '#CC0000',
  2: '#0000CC',
}

// Who is the next player if the last player was playOrder[player]
const playOrder = {
  1: 2,
  2: 1,
}

function buildGameBoard(n) {
  let gameBoard = []

  for (let i of [...Array(n).keys()]) {
    gameBoard[i] = [];
    for (let j of [...Array(n).keys()]) {
      gameBoard[i][j] = 0;
    }
  }

  return(gameBoard);
}

class Grid extends Component {
  constructor(props) {
    super(props)

    let selected = buildGameBoard(this.props.size);

    this.state = {
      selected: selected,
      nextPlayer: 1,
      moves: [],
      history: []
    }
  }

  handleReset = () => {
    let selected = buildGameBoard(this.props.size);

    this.setState({
      selected: selected,
      nextPlayer: 1,
      moves: [],
      history: []
    })
  }

  handleUndo = () => {
    let history = this.state.history;
    let lastMove = history.pop();

    if (!!lastMove) {
      let moves = this.state.moves.slice();
      moves.pop();
      let selected = this.state.selected;
      selected[lastMove[0]][lastMove[1]] = 0;
      let nextPlayer = playOrder[this.state.nextPlayer]

      this.setState({
        selected: selected,
        nextPlayer: nextPlayer,
        moves: moves,
        history: history,
      })
    }
  }

  handleColClick = (col) => {
    let selected = this.state.selected;
    for (let i of [...Array(this.props.size).keys()]) {
      if (!selected[col][i]) {
        selected[col][i] = this.state.nextPlayer;
        let nextPlayer = playOrder[this.state.nextPlayer];
        let moves = this.state.moves.slice();
        moves.push(col + 1);
        let history = this.state.history.slice();
        history.push([col, i]);

        this.setState({
          selected: selected,
          nextPlayer: nextPlayer,
          moves: moves,
          history: history
        })
        break;
      }
    }
  }

  renderCell = (row, col) => {
    let color = '#cccccc';
    let selected = this.state.selected;
    if (this.state.selected[col][this.props.size - 1 - row]) {
      color = colors[selected[col][this.props.size - 1 - row]]
    }

    return(
      <td key={`${row}${col}`} onClick={this.handleColClick.bind(this, col)}>
        <Circle r={this.props.radius} fill={{color:`${color}`}} />
      </td>
    )
  }

  renderCells = (row) => {
    return([...Array(this.props.size).keys()].map(this.renderCell.bind(this, row)));
  }

  renderRow = (row) => {
    return(
      <tr key={row}>
        {this.renderCells(row)}
      </tr>
    );
  }

  renderRows = () => {
    return([...Array(this.props.size).keys()].map(this.renderRow));
  }

  render() {
    return (
      <div>
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <div>
            <table>
              <tbody>
                {this.renderRows()}
              </tbody>
            </table>
          </div>
          <div>
            <MoveStats moves={this.state.moves} />
          </div>
        </div>
        <button onClick={this.handleUndo}>Undo</button>
        <button onClick={this.handleReset}>Reset</button>
      </div>
    );
  }
}

export default Grid;
