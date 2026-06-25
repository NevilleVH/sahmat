import { type Move, type Opening } from '$lib/openings';
import type { Position } from './pieces';

interface Node {
    name: string
    move: Move
    nodes: Trie
    player_win?: number
}

type Trie = Record<string, Node>


export function buildTrie(ops: Opening[]) {
    let t: Trie = {}
    ops.toSorted((o1, o2) => o1.uci.length > o2.uci.length ? 1 : -1).forEach(opening => {
        addNodes(t, opening)
    })
    return t
}

function positionLabel({ col, row }: Position) {
    return String.fromCharCode(col + 97) + (8 - row)
}

export function moveLabel(m: Move) {
    return `${positionLabel(m.start)}:${positionLabel(m.end)}`
}

function addNodes(t: Trie, opening: Opening) {
    opening.uci.forEach((m) => {
        const n: Node = t[moveLabel(m)] ??= {
            move: m,
            name: opening.name,
            nodes: {},
            player_win: opening.player_win
        }
        t = n.nodes
    })
}   
