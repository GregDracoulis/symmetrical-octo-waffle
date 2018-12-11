import React, { Component } from 'react';
import { Pie } from 'react-chartjs-2';


class MoveStats extends Component {
  constructor(props) {
    super(props);

    this.state = {
      zeroState: true,
      loading: false,
      data: {}
    }
  }

  componentDidUpdate = (prevProps, prevState) => {
    // Check if the moves have changed, if so we must fetch data from the API
    if (JSON.stringify(prevProps.moves) !== JSON.stringify(this.props.moves)) {
      if (this.props.moves.length === 0) {
        this.setState({
          zeroState: true,
          loading: false,
          data: {}
        });
        return;
      }

      this.setState({
        zeroState: false,
        loading: true
      })
      let movesString = this.props.moves.join(',');
      fetch(`http://localhost:5000/results?moves=${movesString}`).then(response => {
        return response.json()
      }).then(responseJson => {
        console.log(responseJson);

        this.setState({
          zeroState: false,
          loading: false,
          data: responseJson
        })
      })
    }
  }

  render() {
    if (this.state.zeroState) {
      return (
        <div>
          Make some moves to load statistics
        </div>
      );
    } else if (this.state.loading) {
      return (
        <div>
          Loading
        </div>
      );
    } else {
      return (
        <div>
          <Pie width={300} height={300} data={{
          	labels: [
          		'P1 Wins',
          		'P2 Wins',
          		'Draw'
          	],
          	datasets: [{
          		data: [this.state.data.win, this.state.data.lose, this.state.data.draw],
          		backgroundColor: [
          		'#CC0000',
          		'#0000CC',
          		'#660066'
          		],
          		hoverBackgroundColor: [
          		'#FF6384',
          		'#36A2EB',
          		'#994499'
          		]
          	}]
          }} />
        </div>
      )
    }
  }
}

export default MoveStats;
