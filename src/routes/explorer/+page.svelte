<script lang="ts">
	import {
		type Board,
		dimension,
		newBoard,
		pieceImgs,
		type Piece,
		type Colour,
		posEq,
		type Position
	} from '$lib/pieces';
	import * as R from 'ramda';
	import { type Move, openings } from '$lib/openings';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { buildTrie } from '$lib/trie';
    // TODO: keep ref to root of trie so it doesn't have to be rebuilt each time
    // TODO: add parent ref to make rewind more efficient
    // TODO: factor out board component

	let board = $state<Board>(newBoard());
	let selectedPiece = $state<Piece>();
	let possibleMoves = $derived(selectedPiece?.possibleMoves(board));

	let pieces = $derived(
		board
			.flatMap((row, rowIdx) =>
				row.map((piece, colIdx) => (piece ? { piece, row: rowIdx, col: colIdx } : null))
			)
			.filter(R.isNotNil)
	);
	// TODO: make move then show possible opening continuations/name
    let currentMove = $state<Move>()
	// let currentMove = $derived.by(() => {
    //     let t = buildTrie(openings)
    //     let cm: Move | undefined
    //     moveList.forEach(m => {
    //         const {nodes, move} = t[m]
    //         cm = move
    //         t = nodes
    //     })
    //     return cm
    // });


	function getPiece(pos?: Position) {
        if (!pos) {
            console.error('no pos')
            return
        }
		return board[pos.row][pos.col];
	}

	function maybeCastle(move: Move) {
		const { start, end } = move;
		if (getPiece(start)?.tag !== 'king') {
			return;
		}
		const d = end.col - start.col;
		if (Math.abs(d) <= 1) {
			return;
		}
		const castleEnd = {
			row: start.row,
			col: end.col - Math.sign(d)
		};
		const castleCol = Math.sign(d) > 0 ? 7 : 0;
		applyMove({
			start: {
				row: start.row,
				col: castleCol
			},
			end: castleEnd
		});
	}

	function maybeEnPassant({ start, end }: Move) {
		if (getPiece(start)?.tag !== 'pawn') {
			return;
		}
		if (start.col === end.col || getPiece(end)) {
			return;
		}
		board[start.row][end.col] = null;
	}

	function applyMove(move: Move) {
		maybeCastle(move);
		maybeEnPassant(move);
		const { start, end } = move;
		board[end.row][end.col] = board[start.row][start.col];
		board[start.row][start.col] = null;
	}

	let trie = $state(buildTrie(openings));
    let moveList = $state(new Array<string>())
</script>

<div id="app-container">
	<div id="board-container">
		<div id="board">
			<div>
				<!-- Empty div on top right -->
			</div>
			{#each { length: dimension } as _, i}
				<div class="board-label">{String.fromCharCode(65 + i)}</div>
			{/each}

			<div></div>

			{#each { length: dimension } as _, row}
				<div class="board-label">{dimension - row}</div>
				{#each { length: dimension } as _, col}
					<div class="square">
						<button
							style="height:100%;width:100%"
							style:border-color={currentMove &&
							(posEq(currentMove.start, { row, col }) || posEq(currentMove.end, { row, col }))
								? 'chartreuse'
								: 'transparent'}
							style:background={possibleMoves?.find((p) => p.col === col && p.row === row)
								? 'lime'
								: (row + col) % 2 === 0
									? 'white'
									: 'rgba(0,0,0,0.5)'}
							onclick={() => {
								// if (piece?.colour === turn) {
								//     selectedPiece = piece
								//     return
								// }
								// if (selectedPiece && possibleMoves?.find((p) => p.col===col && p.row === row)) {
								//     board[selectedPiece.position.row][selectedPiece.position.col] = null
								//     selectedPiece.position = {row, col}
								//     board[row][col] = selectedPiece
								//     selectedPiece = undefined
								//     turn = turn === "black" ? 'white': "black"
								// }
							}}
						>
						</button>
					</div>
				{/each}
				<div></div>
			{/each}

			{#each pieces as { piece, row, col } (piece.id)}
				<img
					class="piece"
					animate:flip={{ duration: 300 }}
					out:fade={{ duration: 400 }}
					style:left="{(col + 1) * 10}vmin"
					style:top="{(row + 1) * 10}vmin"
					src={pieceImgs[piece.colour][piece.tag]}
					alt="{piece.colour} {piece.tag}"
				/>
			{/each}
		</div>
	</div>
	<div id="move-selector">
        <div style="min-height: 16px; display:flex; gap:4px; flex-wrap:wrap">
            {#each moveList as move}
                <span>{move}</span>
            {/each}
        </div>
        <div style="margin:16px 0px; display: flex; justify-content: center; gap:4px">
            <button onclick={() => {
                moveList.pop()
                trie = buildTrie(openings);
                board = newBoard();
                moveList.forEach(m => {
                    const node = trie[m]
                    applyMove(node.move)
                    currentMove = node.move
                    trie = node.nodes
                })
            }}>
                Back
            </button>
            <button
                
                onclick={() => {
                    trie = buildTrie(openings);
                    board = newBoard();
                    moveList = []
                    currentMove = undefined
                }}>Reset</button
            >
        </div>
		<div id="move-list">
			{#each Object.entries(trie).toSorted(([k1], [k2]) => (k1 > k2 ? 1 : -1)) as [key, node]}
				<button
					class="move-button"
					onclick={() => {
                        moveList.push(key)
						applyMove(node.move);
                        currentMove = node.move
						trie = node.nodes;
					}}
				>
					{`${key} - ${node.name} (${node.player_win ?? "unknown"}%)`}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	@media (orientation: landscape) {
		#app-container {
			display: flex;
		}

		#move-selector {
			width: 25vw;
			margin-right: 16px;
		}
	}

	@media (orientation: portrait) {
		#move-list {
			height: 250px;
		}
	}

	#move-list {
		overflow-y: scroll;
		border: 1px solid black;
		padding: 2px;
	}

	#move-selector {
		display: flex;
		flex-direction: column;
        margin-top: 16px;
	}

	.move-button {
		width: 100%;
		margin: 2px 0px;
	}

	#board {
		display: grid;
		grid-template-columns: repeat(10, 10vmin);
		grid-template-rows: repeat(9, 10vmin);
		position: relative;
	}
	.square {
		border: 1px solid black;
	}
	.board-label {
		text-align: center;
		align-content: center;
	}
	.piece {
		position: absolute;
		width: 10vmin;
		height: 10vmin;
		object-fit: cover;
		pointer-events: none;
	}
	#board-container {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-grow: 1;
	}
	#opening-select {
		height: 20vh;
		overflow-y: scroll;
		display: flex;
		flex-direction: column;
		border: 1px solid black;
	}
</style>
