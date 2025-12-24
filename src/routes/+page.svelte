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
	let board = $state<Board>(newBoard());
	let turn = $state<Colour>('white');
	let selectedPiece = $state<Piece>();
	let possibleMoves = $derived(selectedPiece?.possibleMoves(board));
	// TODO: make move then show possible opening continuations/name

	let selectedOpening = $state(openings[0]);
	let moveIdx = $state(-1);
	let currentMove = $derived(selectedOpening?.uci[moveIdx]);

	let codeFilter = $state('');
	let nameFilter = $state('');
	const includes = R.on(R.includes, R.toLower);
	let filteredEcos = $derived(
		openings.filter(({ name, eco }) => {
			return includes(codeFilter, eco) && includes(nameFilter, name);
		})
	);

	function getPiece({ row, col }: Position) {
		return board[row][col];
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

	function maybeEnPassant({start,end}: Move) {
		if (getPiece(start)?.tag !== "pawn") {
			return
		}
		if (start.col === end.col || getPiece(end)) {
			return
		} 
		board[start.row][end.col] = null
	}

	function applyMove(move: Move) {
		maybeCastle(move);
		maybeEnPassant(move);
		const { start, end } = move;
		board[end.row][end.col] = board[start.row][start.col];
		board[start.row][start.col] = null;
	}
</script>

<div id="app-container">
	<div style="display:flex; flex-direction:column; align-items:center">
		<div>
			<div style="text-align: center; margin-bottom: 8px; display:flex; flex-direction:column">
				<label>
					Filter code:
					<input
						oninput={(ev) => {
							codeFilter = ev.currentTarget.value;
						}}
					/>
				</label>
				<label>
					Filter name:
					<input
						oninput={(ev) => {
							nameFilter = ev.currentTarget.value;
						}}
					/>
				</label>
			</div>
			<div id="opening-select">
				{#each filteredEcos as opening}
					<button
						style:background={R.equals(opening, selectedOpening) ? 'lightblue' : 'aliceblue'}
						style="border: 1px solid;"
						onclick={() => {
							selectedOpening = opening;
							board = newBoard();
							moveIdx = -1;
						}}>{opening.eco} {opening.name}</button
					>
				{/each}
			</div>
			<div>
				<div style="text-align: center; margin-top: 8px">
					<strong>
						Selected: {selectedOpening.eco}
						{selectedOpening.name}<br />{selectedOpening.pgn}
					</strong>
				</div>
			</div>
		</div>
	</div>

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
					{@const piece = board.at(row)?.at(col)}
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
							{#if piece}
								<img
									style="object-fit: cover;"
									height="100%"
									width="100%"
									src={pieceImgs[piece.colour][piece.tag]}
								/>
							{/if}
						</button>
					</div>
				{/each}
				<div></div>
			{/each}
		</div>
	</div>
	<div style="display: flex; justify-content:center; gap:4px">
		<button
			disabled={moveIdx < 0}
			onclick={() => {
				const move = selectedOpening?.uci.at(moveIdx);
				if (!move) return;
				// TODO: just reverse the last move but keep track of taken pieces
				board = newBoard();
				selectedOpening?.uci.slice(0, moveIdx).forEach(applyMove);
				moveIdx--;
			}}>Prev</button
		>
		<button
			disabled={!selectedOpening || moveIdx >= selectedOpening.uci.length - 1}
			onclick={() => {
				moveIdx++;
				const move = selectedOpening?.uci.at(moveIdx);
				if (!move) return;
				applyMove(move);
			}}>Next</button
		>
	</div>
</div>

<style>
	#board {
		display: grid;
		grid-template-columns: repeat(10, 10vmin);
		grid-template-rows: repeat(10, 10vmin);
	}
	.square {
		border: 1px solid black;
	}
	.board-label {
		text-align: center;
		align-content: center;
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
