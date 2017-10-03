import React from 'react'
import './Barrier.css'

export default class Barrier extends React.Component {
  render() {
    return (
      <div
        className={`Piece Barrier ${this.props.isMoving
          ? 'Barrier--moving'
          : ''}`}
        style={{
          left: `calc(${this.props.column} * var(--piece-size))`,
          top: `calc(${this.props.row} * var(--piece-size))`
        }}
      />
    )
  }
}
