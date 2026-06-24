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
import type { Move } from "./openings"
import { setResponse } from "@sveltejs/kit/node"

function* iterPieces(board: Board) {
    for (let row of board) {
        for (let item of row) {
            if (item) {
                yield item
            }
        }
    }
}


// may need IDs to identify if piece has moved
function* getPieces(board: Board, colour: Colour, tag: PieceTag) {
    for (let piece of iterPieces(board)) {
        if (piece.colour === colour && piece.tag === tag) {
            yield piece
        }
    }
}

export interface Game {
    board: Board
    moves: {
        piece: Piece
        start: Position
        end: Position
    }[]
}

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



function isCheck(colour: Colour, game: Game) {
    const { board } = game
    const pieces = board.flatMap(row => row.filter(R.isNotNil))

    for (let piece of pieces) {
        if (piece.colour === colour) {
            continue
        }
        for (let pos of piece.possibleMoves(game)) {
            const p = getPiece(board, pos)
            if (p?.tag === "king" && p.colour === colour) {
                return true
            }
        }
    }

}

function maybeCastle(game: Game, move: Move) {
    // just moves the castle: the king's move is the one encoded in the move list
    const { start, end } = move;
    if (getPiece(game.board, start)?.tag !== 'king') {
        return game;
    }
    const d = end.col - start.col;
    if (Math.abs(d) <= 1) {
        return game;
    }
    const castleEnd = {
        row: start.row,
        col: end.col - Math.sign(d)
    };
    const castleCol = Math.sign(d) > 0 ? 7 : 0;

    const board = copyBoard(game.board)



    return applyMove(board, {
        start: {
            row: start.row,
            col: castleCol
        },
        end: castleEnd // hmm this will append a move to game moves - not what we want
    });
}

function maybeEnPassant(game: Game, { start, end }: Move): Game {
    const piece = getPiece(game.board, start)
    if (piece?.tag !== "pawn") {
        return game
    }
    if (start.col === end.col || getPiece(game.board, end)) {
        return game
    }
    const board = copyBoard(game.board)
    // Take opposition piece
    board[start.row][end.col] = null
    return {
        board,
        moves: game.moves // move gets appended in applyMove
    }
}

function copyBoard(board: Board) {
    return board.map(r => [...r])
}

function setPosition(board: Board, pos: Position, piece: Piece | null) {
    board[pos.row][pos.col] = piece
    // TODO update piece position: but these needs to be immutable
}

function applyMove(board: Board, move: Move) {
    const { start, end } = move;
    const piece = board[start.row][start.col]
    if (!piece) {
        throw new Error(`nothing there: ${start.row} ${start.col}`)
    }
    setPosition(board, start, null)
    setPosition(board, end, piece)
    return piece
}


export function updateGame(game: Game, move: Move): Game {
    game = maybeCastle(
        maybeEnPassant(game, move), move);

    const board = copyBoard(game.board)
    const piece = applyMove(board, move)
    // need to update instance positions
    return {
        board, moves: game.moves.concat({
            piece,
            ...move
        })
    }
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
    abstract _possibleMoves(game: Game): Position[]
    abstract tag: PieceTag
    public id: number = pieceIdCounter++

    getPos(board: Board) {

    }
    //abstract img: string
    possibleMoves(game: Game): PositionDelta[] {
        if (game.moves.at(-1)?.piece.colour === this.colour) {
            return []
        }
        const pms = this._possibleMoves(game)
        return pms.filter(p => {
            const next = updateGame(game, {
                start: this.position,
                end: p
            })
            return !isCheck(this.colour, next) && inBounds(p) &&
                game.board.at(p.row)?.at(p.col)?.colour !== this.colour
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

export function getPiece(board: Board, position: Position): Piece | null {
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
    _possibleMoves(game: Game): PositionDelta[] {
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
        test(this.add({ row: 1, col: 0 }), isEmpty(game.board), p => {
            moves.push(p)
        })

        if (!lastMove(this.id, game.moves)) {
            test(this.add({ row: 2, col: 0 }), isEmpty(game.board), p => {
                moves.push(p)
            })
        }
        
        const captures: Position[] = [{row: 1, col: 1}, {row: 1, col: -1}]
        captures.forEach(p => {
            // also check if it isn't your piece - this happens in Piece.possibleMoves
            test(this.add(p), R.o(R.not, isEmpty(game.board)), p => {
                moves.push(p)
            })
        })

        // en passant
        const prevMove = game.moves.at(-1)
        if (!prevMove) {
            return moves
        }
        const { end, piece, start } = prevMove

        if (piece.tag === "pawn" && end.row - start.row > 1 &&
            end.row == this.position.row && Math.abs(end.col - this.position.col) === 1) {
            moves.push({
                row: this.position.row + 1,
                col: end.col
            })
            // TODO: when the move is applied, the piece must be taken
        }

        return moves
    }
}

export class Bishop extends Piece {
    tag: PieceTag = "bishop"
    constructor(public colour: Colour, public position: Position) {
        super()
    }

    _possibleMoves({ board }: Game): Position[] {
        
        return R.xprod([-1,1], [-1,1]).flatMap(([xd, yd]) => {
            const delta = {row: yd, col: xd}
            return takeUntilPiece(this.position, delta, board)
        })
    }
}

function lastMove(id: number, moves: Game["moves"]) {
    return moves.findLast(({ piece }) => piece.id === id)
}

export class King extends Piece {
    tag: PieceTag = "king"

    constructor(public colour: Colour, public position: Position) {
        super()
    }

    _possibleMoves({ board, moves }: Game): Position[] {
        const deltas = R.xprod([-1,0,1], [-1, 0, 1])
        const positions = deltas.map(([row, col]) => {
            return this.add({row, col})
        })
        if (!lastMove(this.id, moves)) {
            const castles = getPieces(board, this.colour, "castle")
            for (let castle of castles) {
                if (!lastMove(castle.id, moves)) {
                    const unit = Math.sign(castle.position.col - this.position.col)
                    let ok = true
                    for (let x = this.position.col + 1; x !== castle.position.col; x += unit) {
                        if (getPiece(board, { col: x, row: this.position.row })) {
                            ok = false
                            break
                        }
                    }
                    if (ok) {
                        // applyMove takes care of the castle position
                        positions.push({
                            row: this.position.row,
                            col: this.position.col + unit * 2
                        })
                    }
                }
            }
        }

        return positions
    }
}

export class Castle extends Piece {
    tag: PieceTag = "castle"
    constructor(public colour: Colour, public position: Position) {
        super()
    }

    _possibleMoves({ board }: Game): Position[] {
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

    _possibleMoves(game: Game): Position[] {
        const c = new Castle(this.colour, this.position)
        const b = new Bishop(this.colour, this.position)
        return c.possibleMoves(game).concat(b.possibleMoves(game))
    }
}

export class Knight extends Piece {
    tag: PieceTag = "knight"
    constructor(public colour: Colour, public position: Position) {
        super()
    }

    _possibleMoves({ board }: Game): Position[] {
        const deltas = [{row: 1, col: 2}, {row: 2, col: 1}]
        return R.xprod([-1, 1], ["row", "col"] as const).flatMap(([d, field, ]) => {
            return deltas.map(delta => this.add(R.modify(field, R.multiply(d), delta)))
        })
    }
}