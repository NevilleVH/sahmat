import rawOpenings from "$lib/assets/openings.json"
import z from "zod"
import { dimension, type Position } from "./pieces"
import * as R from "ramda"
const uciSchema = z.templateLiteral(
    [z.enum(["a", "b", "c", "d", "e", "f", "g", "h"]), z.number().min(1).max(8)]).
    transform(([file, rank]): Position =>{
        const row = dimension-Number.parseInt(rank)
        const col = file.charCodeAt(0) - 97
        return {row, col}
    })

const openingSchema = z.object({
    name: z.string(),
    uci: z.string().transform(s => {
        const moves =  s.split(" ").map(move => {
            const start = uciSchema.parse(move.slice(0, 2))
            const end = uciSchema.parse(move.slice(2, 4))
            return {start, end}
        })
        return moves
    }), 
    eco: z.string(),
    pgn: z.string()
})
const parsed = openingSchema.array().parse(rawOpenings)
export type Opening = z.output<typeof openingSchema>
export type Move = Opening["uci"][number]

export const openings = parsed
export const ecoCodes = parsed.map(o => o.eco)

export const byEco = R.groupBy(R.prop("eco"), parsed)
