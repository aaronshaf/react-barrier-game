import React from 'react'
import range from 'lodash/range'
import shuffle from 'lodash/shuffle'
import flatMap from 'lodash/flatMap'
import difference from 'lodash/difference'
import uuid from 'uuid'
import Barrier from './Barrier'
import Critter from './Critter'
import Player from './Player'
import Target from './Target'
import GameOver from './GameOver'
import createGraph from 'ngraph.graph'
import ngraph from 'ngraph.path'
import './Game.css'

const INTERVAL = 500
const MAX_CRITTER_COUNT = 4
const STARTING_BARRIER_COUNT = 20
const MAX_BARRIERS = 80
const MAX_MOVING_BARRIERS = 20

export default class Game extends React.Component {
  constructor(props) {
    super(props)
    const boardSize = this.props.boardSize
    const columnIndexes = range(0, boardSize)

    const graph = createGraph()
    const allCells = flatMap(columnIndexes, columnIndex =>
      range(boardSize).map(rowIndex => [columnIndex, rowIndex])
    )
    allCells.forEach(cell => {
      const cellId = `${cell[0]},${cell[1]}`
      graph.addNode(cellId)
      if (cell[0] > 0) {
        graph.addLink(cellId, `${cell[0] - 1},${cell[1]}`)
      }
      if (cell[1] > 0) {
        graph.addLink(cellId, `${cell[0]},${cell[1] - 1}`)
      }
    })

    const fillableCells = flatMap(columnIndexes, columnIndex =>
      range(3, boardSize - 3).map(rowIndex => [columnIndex, rowIndex])
    )
    const shuffledCells = shuffle(fillableCells)
    const barriers = shuffledCells
      .slice(0, STARTING_BARRIER_COUNT)
      .map(cell => {
        return {
          id: uuid.v1(),
          column: cell[0],
          row: cell[1],
          isMoving: false
        }
      })

    const player = {
      column: Math.floor(boardSize / 2),
      row: boardSize - 1
    }

    const target = {
      column: Math.floor(boardSize / 2),
      row: 0
    }

    this.state = {
      barriers,
      critters: [],
      graph,
      player,
      target,
      isGameOver: false,
      score: 0
    }
    this.setPathFinder()
  }

  componentDidMount() {
    setInterval(this.updateGame, INTERVAL)
    document.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown)
  }

  handleKeyDown = event => {
    const player = this.state.player
    switch (event.key) {
      case 'Enter': {
        if (this.state.isGameOver) {
          // TODO: restart game without reloading
          window.reload()
        }
        break
      }
      case 'ArrowLeft': {
        const column = player.column > 0 ? player.column - 1 : player.column
        this.setState({
          player: {
            ...player,
            column
          }
        })
        break
      }
      case 'ArrowRight': {
        const column =
          player.column >= this.props.boardSize - 1
            ? player.column
            : player.column + 1
        this.setState({
          player: {
            ...player,
            column
          }
        })
        break
      }
      case 'ArrowUp':
      case ' ': {
        const numbersOfMovingBarriers = this.state.barriers.filter(
          barrier => barrier.isMoving
        ).length
        const tooManyBarriers = this.state.barriers.length < MAX_BARRIERS
        const collidesWithBarrierAbove =
          this.state.barriers.some(
            barrier =>
              barrier.column === player.column && barrier.row === player.row - 1
          ) === false
        const collidesWithCritterAbove =
          this.state.critters.some(
            critter =>
              critter.column === player.column && critter.row === player.row - 1
          ) === false
        if (
          tooManyBarriers &&
          collidesWithBarrierAbove &&
          numbersOfMovingBarriers < MAX_MOVING_BARRIERS
        ) {
          const newBarrier = {
            id: uuid.v1(),
            column: player.column,
            row: player.row,
            isMoving: true
          }
          this.setState({
            barriers: this.state.barriers.concat(newBarrier)
          })
        }
        break
      }
      default:
        break
    }
  }

  setPathFinder = () => {
    this.pathFinder = ngraph.aStar(this.state.graph, {
      distance: (fromNode, toNode) => {
        const [x1, y1] = fromNode.id.split(',').map(stringToNumber)
        const [x2, y2] = toNode.id.split(',').map(stringToNumber)
        const isBarrier = this.state.barriers.some(
          barrier => barrier.column === x2 && barrier.row === y2
        )
        if (isBarrier) {
          return 100
        }
        const dx = x1 - x2
        const dy = y1 - y2
        return Math.sqrt(dx * dx + dy * dy)
      },
      heuristic(fromNode, toNode) {
        const [x1, y1] = fromNode.id.split(',').map(stringToNumber)
        const [x2, y2] = toNode.id.split(',').map(stringToNumber)
        const dx = x1 - x2
        const dy = y1 - y2
        return Math.sqrt(dx * dx + dy * dy)
      }
    })
  }

  updateGame = () => {
    const crittersToRemove = []
    const barriersToRemove = []

    // Move barriers
    const movedBarriers = this.state.barriers.map(barrier1 => {
      if (barrier1.isMoving) {
        const barrierAboveHit = this.state.barriers.some(
          barrier2 =>
            barrier2.isMoving === false &&
            barrier1 !== barrier2 &&
            barrier1.column === barrier2.column &&
            barrier1.row - 1 === barrier2.row
        )
        const critterHit = this.state.critters.find(
          critter =>
            barrier1.column === critter.column &&
            (barrier1.row === critter.row || barrier1.row - 1 === critter.row)
        )
        if (barrierAboveHit || critterHit || barrier1.row <= 3) {
          if (critterHit) {
            crittersToRemove.push(critterHit)
          }
          return {
            ...barrier1,
            isMoving: false
          }
        } else {
          return {
            ...barrier1,
            row: barrier1.row - 1
          }
        }
      }
      return barrier1
    })

    // Move critters, remove busted barriers
    const isGameOver = this.state.critters.some(
      critter => critter.row >= this.props.boardSize - 1
    )
    if (isGameOver) {
      return this.setState({
        isGameOver: true
      })
    }
    const movedCritters = difference(
      this.state.critters,
      crittersToRemove
    ).reduce((state, critter) => {
      if (critter.path.length > 0) {
        const nextNode = critter.path.pop()
        const [x1, y1] = nextNode.id.split(',').map(stringToNumber)
        const barrierHit = movedBarriers.find(
          barrier =>
            barrier.isMoving === false &&
            barrier.column === x1 &&
            (barrier.row === y1 || barrier.row === y1 - 1)
        )
        if (barrierHit) {
          barriersToRemove.push(barrierHit)
          return state
        } else {
          return state.concat({
            ...critter,
            column: x1,
            row: y1
          })
        }
      }
      return state
    }, [])

    // Add critters
    const crittersToAdd = []
    if (this.state.critters.length < MAX_CRITTER_COUNT) {
      const fromId = `${this.state.target.column},${this.state.target.row}`
      const toId = `${this.state.player.column},${this.state.player.row}`
      const newCritter = {
        id: uuid.v1(),
        column: this.state.target.column,
        row: 1,
        path: this.pathFinder.find(fromId, toId).slice(0, -1)
      }
      crittersToAdd.push(newCritter)
    }

    this.setState({
      critters: movedCritters.concat(crittersToAdd),
      barriers: difference(movedBarriers, barriersToRemove),
      score: this.state.score + barriersToRemove.length
    })
  }

  render() {
    const barrierComponents = this.state.barriers.map(barrier => {
      return (
        <Barrier
          key={barrier.id}
          row={barrier.row}
          column={barrier.column}
          isMoving={barrier.isMoving}
        />
      )
    })

    const critterComponents = this.state.critters.map(critter => {
      return (
        <Critter key={critter.id} row={critter.row} column={critter.column} />
      )
    })

    const player = this.state.player
    const playerComponent = <Player row={player.row} column={player.column} />

    const target = this.state.target
    const targetComponent = <Target row={target.row} column={target.column} />

    return (
      <div>
        <div>Score: {this.state.score}</div>
        <div
          className="Game"
          style={{
            width: `calc(${this.props.boardSize} * var(--piece-size))`,
            height: `calc(${this.props.boardSize} * var(--piece-size))`
          }}
        >
          {barrierComponents}
          {playerComponent}
          {targetComponent}
          {critterComponents}
          {this.state.isGameOver && (
            <GameOver boardSize={this.props.boardSize}>Game over</GameOver>
          )}
        </div>
      </div>
    )
  }
}

function stringToNumber(string) {
  return parseInt(string, 10)
}
