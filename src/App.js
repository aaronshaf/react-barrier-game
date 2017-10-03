import React, { Component } from 'react'
import Game from './Game'
import './App.css'

class App extends Component {
  render() {
    return (
      <div className="App">
        <h1>react-barrier-game</h1>
        <Game boardSize={12} />
      </div>
    )
  }
}

export default App
