import React from 'react'
import './Player.css'

export default class Player extends React.Component {
  render() {
    return (
      <div
        className="Piece Player"
        style={{
          left: `calc(${this.props.column} * var(--piece-size))`,
          top: `calc(${this.props.row} * var(--piece-size))`
        }}
      />
    )
  }
}
