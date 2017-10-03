import React from 'react'

export default class GameOver extends React.Component {
  render() {
    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: `calc(${this.props.boardSize} * var(--piece-size))`,
          height: `calc(${this.props.boardSize} * var(--piece-size))`
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            opacity: 0.5,
            backgroundColor: 'red',
            flex: 1,
            width: `calc(${this.props.boardSize} * var(--piece-size))`,
            height: `calc(${this.props.boardSize} * var(--piece-size))`
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            display: 'flex',
            width: `calc(${this.props.boardSize} * var(--piece-size))`,
            height: `calc(${this.props.boardSize} * var(--piece-size))`
          }}
        >
          <div
            style={{
              margin: 'auto',
              color: 'white',
              fontSize: '2rem'
            }}
          >
            Game over
          </div>
        </div>
      </div>
    )
  }
}
