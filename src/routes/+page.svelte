<script lang="ts">
	import {
		type Board,
		dimension,
		newBoard,
		pieceImgs,
		type Piece,
		type Colour,
		posEq
	} from '$lib/pieces';
	import { byEco, type Move, ecoCodes } from '$lib/openings';
	let board = $state<Board>(newBoard());

	let turn = $state<Colour>('white');
	let selectedPiece = $state<Piece>();
	let possibleMoves = $derived(selectedPiece?.possibleMoves(board));
	// TODO: make move then show possible opening continuations/name
	let selectedCode = $state(ecoCodes[0]);
	let selectedOpening = $derived(byEco.get(selectedCode));
	let moveIdx = $state(-1);
	let currentMove = $derived(selectedOpening?.uci[moveIdx]);
	function applyMove(move: Move) {
		const { start, end } = move;
		board[end.row][end.col] = board[start.row][start.col];
		board[start.row][start.col] = null;
	}
</script>

<div id="app-container">
	<div style="display:flex; flex-direction:column; align-items:center">
		<!-- <label for="opening-search">Search for an opening: </label>
		<input
			id="opening-search"
			oninput={(ev) => {
				const code = ev.currentTarget.value;
				console.log(code);

				if (byEco.get(code)) {
					selectedCode = code;
				}
			}}
			style:width="100%"
			list="openings"
		/>

		<datalist id="openings">
			{#each byEco as [eco, { name }]}
				<option value={eco}>{eco} {name}</option>
			{/each}
		</datalist> -->

		<select
			style:width="100%"
			value={selectedCode}
			onchange={({ currentTarget }) => {
				const opening = byEco.get(currentTarget.value);
				if (opening) {
					selectedOpening = opening;
					board = newBoard();
					moveIdx = -1;
				}
			}}
		>
			{#each byEco as [eco, { name }]}
				<option value={eco}>{eco} {name}</option>
			{/each}
		</select>
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
								<img height="100%" width="100%" src={pieceImgs[piece.colour][piece.tag]} />
							{/if}
						</button>
					</div>
				{/each}
				<div></div>
			{/each}
		</div>
	</div>
	<div style="display: flex; justify-content:center; gap:4px; margin:4px 0px">
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
</style>
