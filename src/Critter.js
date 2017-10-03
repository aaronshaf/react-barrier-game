import React from 'react'
import './Critter.css'

export default class Critter extends React.Component {
  render() {
    return (
      <div
        className="Piece Critter"
        style={{
          left: `calc(${this.props.column} * var(--piece-size))`,
          top: `calc(${this.props.row} * var(--piece-size))`
        }}
      />
    )
  }
}
