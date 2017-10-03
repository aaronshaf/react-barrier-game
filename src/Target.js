import React from 'react'
import './Target.css'

export default class Target extends React.Component {
  render() {
    return (
      <div
        className="Piece Target"
        style={{
          left: `calc(${this.props.column} * var(--piece-size))`,
          top: `calc(${this.props.row} * var(--piece-size))`
        }}
      />
    )
  }
}
