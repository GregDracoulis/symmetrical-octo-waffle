import React, { Component } from 'react';
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
  Markers,
  Marker
} from 'react-simple-maps';
import ReactTooltip from "react-tooltip"
import Grid from './Grid'
import './App.css';

const wrapperStyles = {
  width: "100%",
  maxWidth: 980,
  margin: "0 auto",
}

// Map from country code to country name and coordinates
// TODO: refactor this into a constants file or JSON data file
const natData = {
  'AU': {
    name: 'Australia',
    coordinates: [133.7751, -25.2744],
  },
  'BR': {
    name: 'Brazil',
    coordinates: [-51.9253, -14.2350],
  },
  'CA': {
    name: 'Canada',
    coordinates: [-106.3468, 56.1304],
  },
  'CH': {
    name: 'Switzerland',
    coordinates: [8.2275, 46.8182],
  },
  'DE': {
    name: 'Germany',
    coordinates: [10.4515, 51.1657],
  },
  'DK': {
    name: 'Denmark',
    coordinates: [9.5018, 56.2639],
  },
  'ES': {
    name: 'Spain',
    coordinates: [-3.7492, 40.4637],
  },
  'FI': {
    name: 'Finland',
    coordinates: [25.7482, 61.9241],
  },
  'FR': {
    name: 'France',
    coordinates: [2.2137, 46.2276],
  },
  'GB': {
    name: 'Great Britain',
    coordinates: [-3.4360, 55.3781],
  },
  'IE': {
    name: 'Ireland',
    coordinates: [-7.6921, 53.1424],
  },
  'IR': {
    name: 'Iran',
    coordinates: [53.6880, 32.4279],
  },
  'NL': {
    name: 'Netherlands',
    coordinates: [5.2913, 52.1326],
  },
  'NZ': {
    name: 'New Zealand',
    coordinates: [174.8860, -40.9006],
  },
  'TR': {
    name: 'Turkey',
    coordinates: [35.2433, 38.9637],
  },
  'US': {
    name: 'United States',
    coordinates: [-95.7129, 37.0902],
  },
}

// How much to scale the map dots (scalingFactor * samples)
const scalingFactor = (1/15);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: {},
      averageEloRating: 0,
    };
  }

  componentDidMount = () => {
    this.fetchStats()
    setTimeout(() => {
      ReactTooltip.rebuild()
    }, 100)
  }

  fetchStats = () => {
    fetch('http://localhost:5000/stats').then(response => {
      return response.json();
    }).then(responseJson => {
      // compute the weighted average of mean elo ratings by country
      let countryCodes = Object.keys(responseJson)
      let totalSamples = 0
      let weightedEloSum = 0

      for (let countryCode of countryCodes) {
        let samples = responseJson[countryCode].eloRating.samples
        let weightedElo = (responseJson[countryCode].eloRating.mean * samples)

        totalSamples = totalSamples + samples
        weightedEloSum = weightedEloSum + weightedElo
      }

      let averageEloRating = (weightedEloSum / totalSamples)

      this.setState({
        stats: responseJson,
        averageEloRating: averageEloRating
      })
    })
  }

  // TODO: Extract renderMarker and renderMarkers into their own components
  renderMarker = (k, stats) => {
    let redValue = 128;
    let blueValue = 128;

    // Marker should be purple if average, blue-ish if above average, reddish if below average
    // TODO: maybe scale how much the color changes according to the quantile rather than just the difference?
    if (stats.eloRating.mean > this.state.averageEloRating) {
      blueValue = blueValue + Math.abs(stats.eloRating.mean - this.state.averageEloRating)/2
      redValue = redValue - Math.abs(stats.eloRating.mean - this.state.averageEloRating)/2
    } else if (stats.eloRating.mean < this.state.averageEloRating) {
      blueValue = blueValue - Math.abs(this.state.averageEloRating - stats.eloRating.mean)/2
      redValue = redValue + Math.abs(this.state.averageEloRating - stats.eloRating.mean)/2
    }

    return(
      <Marker
        key={k}
        marker={natData[k]}
        style={{
          default: { fill: `rgb(${parseInt(redValue)},0,${parseInt(blueValue)})` },
          hover: { fill: `rgb(${parseInt(redValue)},0,${parseInt(blueValue)})`, opacity: "0.4" },
          pressed: { fill: `rgb(${parseInt(redValue)},0,${parseInt(blueValue)})` },
        }}
        >
        <circle
          cx={0}
          cy={0}
          r={stats.eloRating.samples * scalingFactor}
          style={{
            opacity: 0.9,
          }}
          data-tip={`
            ${natData[k].name}<br />
            Ranked Players: ${stats.eloRating.samples}<br />
            Mean Elo Rating: ${stats.eloRating.mean.toFixed(2)}<br />
            Median Elo Rating: ${stats.eloRating.median}<br />
            Std Dev: ${stats.eloRating.std}<br />
            Range: [${stats.eloRating.min}, ${stats.eloRating.max}]`}
        />
      </Marker>
    );
  }

  renderMarkers = () => {
    return Object.keys(this.state.stats).map((key, i) => this.renderMarker(key, this.state.stats[key]))
  }

  render() {
    return (
      <div style={wrapperStyles}>
        <ComposableMap
          projectionConfig={{
            scale: 205,
            rotation: [-11,0,0],
          }}
          width={980}
          height={551}
          style={{
            width: "100%",
            height: "auto",
          }}
          >
          <ZoomableGroup center={[0,20]} disablePanning>
            <Geographies geography="/world-50m.json">
              {(geographies, projection) => geographies.map((geography, i) => geography.id !== "ATA" && (
                <Geography
                  key={i}
                  geography={geography}
                  projection={projection}
                  style={{
                    default: {
                      fill: "#ECEFF1",
                      stroke: "#607D8B",
                      strokeWidth: 0.75,
                      outline: "none",
                    },
                    hover: {
                      fill: "#ECEFF1",
                      stroke: "#607D8B",
                      strokeWidth: 0.75,
                      outline: "none",
                    },
                    pressed: {
                      fill: "#ECEFF1",
                      stroke: "#607D8B",
                      strokeWidth: 0.75,
                      outline: "none",
                    },
                  }}
                />
              ))}
            </Geographies>
            <Markers>
             {this.renderMarkers()}
           </Markers>
          </ZoomableGroup>
        </ComposableMap>
        <ReactTooltip multiline={true} />
        <Grid size={4} radius={30} />
      </div>
    );
  }
}

export default App;
