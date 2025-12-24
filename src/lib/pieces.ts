import * as R from "ramda"
export type Board = (Piece|null)[][]
export type Colour = "white" | "black"
export type Position = {row: number, col: number}
import imgKingDark from "$lib/assets/king-d.png"
import imgQueenDark from "$lib/assets/queen-d.png"
import imgBishopDark from "$lib/assets/bishop-d.png"
import imgKnightDark from "$lib/assets/knight-d.png"
import imgCastleDark from "$lib/assets/castle-d.png"
import imgPawnDark from "$lib/assets/pawn-d.png"
import imgKingLight from "$lib/assets/king-l.png"
import imgQueenLight from "$lib/assets/queen-l.png"
import imgBishopLight from "$lib/assets/bishop-l.png"
import imgKnightLight from "$lib/assets/knight-l.png"
import imgCastleLight from "$lib/assets/castle-l.png"
import imgPawnLight from "$lib/assets/pawn-l.png"

export const pieceImgs: Record<Colour, Record<PieceTag, string>> = {
    black: {
        pawn: imgPawnDark,
        castle: imgCastleDark,
        knight: imgKnightDark,
        bishop: imgBishopDark,
        king: imgKingDark,
        queen: imgQueenDark
    },
    white: {
        pawn: imgPawnLight,
        castle: imgCastleLight,
        knight: imgKnightLight,
        bishop: imgBishopLight,
        king: imgKingLight,
        queen: imgQueenLight
    }
}

export function newBoard(): Board {
    const ctrs = [Castle, Knight, Bishop, Queen, King, Bishop, Knight, Castle]
    const board = R.times(() => R.repeat<Piece|null>(null, dimension), dimension)
    ctrs.forEach((cons, col) => {
        board[dimension-1][col] = new cons("white", {row: dimension-1, col})
        board[0][col] = new cons("black", {row: 0, col})
    })
    board[dimension-2] = R.times((col) => new Pawn("white", {row: dimension-2, col}), dimension)
    board[1] = R.times((col) => new Pawn("black", {row: 1, col}), dimension)
    return board
}

const add = R.curry((p1: Position, p2: Position): Position  => {
    return {row: p1.row + p2.row, col: p1.col + p2.col}
})

export function posEq(p1: Position, p2: Position) {
    return p1.col === p2.col && p1.row === p2.row
}

// export function pieceImg(p: Piece) {
//     R.cond([
//         [R.is(Pawn), R.always(imgPawn)],
//         [R.is(Castle), R.always(imgCastle)],
//         [R.is(Bishop), R.always(imgBishop)],
//         [R.is(Knight), R.always(imgKnight)],
//         [R.is(King), R.always(imgKing)],
//         [R.is(Knight), R.always(imgKnight)],

//     ])
    
// }

type PieceTag = "pawn" | "castle" | "knight" | "bishop" | "king" | "queen"

let pieceIdCounter = 0;

export abstract class Piece {
    abstract colour: Colour
    abstract position: Position
    abstract _possibleMoves(board: Board): Position[]
    public moves: Position[] = []
    abstract tag: PieceTag
    public id: number = pieceIdCounter++
    //abstract img: string
    possibleMoves(board: Board): PositionDelta[] {
        const pms = this._possibleMoves(board)
        return pms.filter(p => {
            return inBounds(p) && board.at(p.row)?.at(p.col)?.colour !== this.colour
        })
    }

    reflect({row, col}: Position): Position {
        if (this.colour === "white") {
            return {
                row: -row,
                col
            }
        }
        return {row, col}
    }

    add(other: PositionDelta) {
        console.log("add", this.position, this.reflect(other), add(this.position, this.reflect(other)))
        return add(this.position, this.reflect(other))
    }
}
export const dimension = 8

const bound = (n: number) => n >= 0 && n < dimension
const inBounds = (position: Position, ):boolean  => {
    return bound(position.col) && bound(position.row)
}

const isEmpty = R.curry((board: Board, position: Position):boolean => {
    console.log(!!getPiece(board, position))
    return !getPiece(board, position)
})

function getPiece(board: Board, position: Position): Piece | null {
    console.log('piece', position,  board.at(position.row)?.at(position.col) )
    return board.at(position.row)?.at(position.col) ?? null
}


// type Movement = "horiz" | "vert" | "diag"
// type Direction = "forward" | "backward"
// type RelativePosition = {
//     vert: {
//         delta: number
//     },
//     horiz: {
//         delta: number
//     }
// }

type PositionDelta = Position

function test(p: Position, predicate: (p: Position) => boolean, onTrue: (p:Position) => void) {
    console.log("test",p, predicate(p))
    if (predicate(p)) {
        onTrue(p)
    }
}

function pairToPosition([x,y]: [number, number]): Position {
    
    return {col: x, row: y}
}

function takeUntilPiece(start: Position, delta: PositionDelta, board: Board) {
    const result: Position[] = []
    for (let pos = add(start, delta); inBounds(pos); pos = add(pos, delta)) {
        result.push(pos)
        if (getPiece(board, pos)) {
            break
        }
    }
    return result
}

export class Pawn extends Piece {
    tag: PieceTag = "pawn"
    constructor(public colour: Colour, public position: Position) {
        super()
    }

    // get img() {
    //     return imgPawn
    // }
    _possibleMoves(board: Board): PositionDelta[] {
        // assume position is relative for now
        // const relativeRow = this.colour === "black" ? 
        // board.length - this.position.row
        //      : this.position.row
        //throw "won't work until moves get populated"
        const moves: PositionDelta[] = []
        // R.applyTo(this.add({row: 1, col: 0}),  
        //     R.when(
        //         isEmpty(board), 
        //         (p) => {
        //             moves.push(p)
        //         })
        //     )
        console.log('!', )
        test(this.add({row: 1, col: 0}), isEmpty(board), p => {
            moves.push(p)
        })

        if (!this.moves.length) {
            test(this.add({row: 2, col: 0}), isEmpty(board), p => {
                moves.push(p)
            })
        }
        
        const captures: Position[] = [{row: 1, col: 1}, {row: 1, col: -1}]
        captures.forEach(p => {
            test(this.add(p), R.o(R.not, isEmpty(board)), p => {
                moves.push(p)
            })
        })

        return moves
    }
}

export class Bishop extends Piece {
    tag: PieceTag = "bishop"
    constructor(public colour: Colour, public position: Position) {
        super()
    }

    _possibleMoves(board: Board): Position[] {
        
        return R.xprod([-1,1], [-1,1]).flatMap(([xd, yd]) => {
            const delta = {row: yd, col: xd}
            return takeUntilPiece(this.position, delta, board)
        })
    }
}

export class King extends Piece {
    tag: PieceTag = "king"

    constructor(public colour: Colour, public position: Position) {
        super()
    }

    _possibleMoves(board: Board): Position[] {
        const deltas = R.xprod([-1,0,1], [-1, 0, 1])
        return deltas.map(([row, col]) => {
            return this.add({row, col})
        })
    }
}

export class Castle extends Piece {
    tag: PieceTag = "castle"
    constructor(public colour: Colour, public position: Position) {
        super()
    }

    _possibleMoves(board: Board): Position[] {
        const positions: Position[] = []

        for (let d of [-1, 1]) {
            positions.push(...takeUntilPiece(this.position, {row: 0, col: d}, board))
            positions.push(...takeUntilPiece(this.position, {row: d, col:0}, board))
        }
        return positions
    }
}

export class Queen extends Piece {
    tag: PieceTag = "queen"
    constructor(public colour: Colour, public position: Position) {
        super()
    }

    _possibleMoves(board: Board): Position[] {
        const c = new Castle(this.colour, this.position)
        const b = new Bishop(this.colour, this.position)
        return c.possibleMoves(board).concat(b.possibleMoves(board))
    }
}

export class Knight extends Piece {
    tag: PieceTag = "knight"
    constructor(public colour: Colour, public position: Position) {
        super()
    }

    _possibleMoves(board: Board): Position[] {
        const deltas = [{row: 1, col: 2}, {row: 2, col: 1}]
        return R.xprod([-1, 1], ["row", "col"] as const).flatMap(([d, field, ]) => {
            return deltas.map(delta => this.add(R.modify(field, R.multiply(d), delta)))
        })
    }
}