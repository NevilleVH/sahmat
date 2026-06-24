import { type Move, type Opening } from '$lib/openings';

interface Node {
    name: string
    move: Move
    nodes: Trie
}

type Trie = Record<string, Node>


export function buildTrie(ops: Opening[]) {
    let t: Trie = {}
    ops.forEach(opening => {
        addNodes(t, opening)
    })
    return t
}

export function moveLabel(m: Move) {
        return String.fromCharCode(m.end.col + 97) + (8-m.end.row)
}

function addNodes(t: Trie, opening: Opening) {
    opening.uci.forEach((m) => {
        const n: Node = t[moveLabel(m)] ??= {
            move: m,
            name: opening.name,
            nodes: {}
        }
        t = n.nodes
    })
}   
