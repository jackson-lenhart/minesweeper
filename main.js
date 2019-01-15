'use strict';

const readline = require('readline');

const { genRandomInt, replicate } = require('./utils');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(str) {
  return new Promise(function(resolve) {
    rl.question(str, function(answer) {
      resolve(answer);
    });
  });
}

/* GLOBAL CONSTANTS */

const numRows = 8;
const numColumns = 8;
const numMines = 8;

function createMineField() {
  // 2d array where first element is row index, second element is column index.
  const mineCoordinates = [];
  let rowIndex;
  let columnIndex;
  for (let i = 0; i < numMines; i++) {
    do {
      rowIndex = genRandomInt(numRows);
      columnIndex = genRandomInt(numColumns);
    }
    // Check if there is already a mine at our random cell
    while (mineCoordinates.some(c => c[0] === rowIndex && c[1] === columnIndex))

    mineCoordinates.push([rowIndex, columnIndex]);
  }

  const mineField = [];
  for (let i = 0; i < numRows; i++) {
    mineField[i] = [];
    for (let j = 0; j < numColumns; j++) {
      if (mineCoordinates.find(c => c[0] === i && c[1] === j)) {
        mineField[i][j] = { isMine: true, show: false };
      }
      else {
        let numAdjacentMines = 0;

        // Adjacent cells have to be within 1 of both x and y coordinates
        const diffs = [-1, 0, 1];
        for (const c of mineCoordinates) {
          if (diffs.includes(i - c[0]) && diffs.includes(j - c[1])) {
            numAdjacentMines++;
          }
        }

        // TODO: Flagging
        mineField[i][j] = { numAdjacentMines, show: false };
      }
    }
  }

  return mineField;
}



function renderMineField(mineField) {
  // clear console
  process.stdout.write('\x1B[2J\x1B[0f');

  const rowLabelPadding = '  ';
  const divider = rowLabelPadding + replicate('-', 8 * 7);

  let str = rowLabelPadding;
  for (let i = 0; i < numColumns; i++) {
    str += `  ${i}    `;
  }
  str += '\n';

  str += divider;
  str += '\n'

  let cell;
  for (let i = 0; i < numRows; i++) {
    // Row label
    str += `${i}|`;
    for (let j = 0; j < numColumns; j++) {
      cell = mineField[i][j];

      if (cell.show) {
        if (cell.isMine) str += '  *   |'
        else str += `  ${cell.numAdjacentMines}   |`;
      }
      else {
        str += ` ${i},${j}  |`;
      }
    }

    str += '\n';
    str += divider;
    str += '\n';
  }

  return str;
}

function recursivelyShowAdjacentCells(mineField, cell, rowIndex, columnIndex) {
  // Note: no explicit base case for this. It terminates by there being no more
  // adjacent cells with 0 adjacent mines.

  let currentCell;
  for (let i = rowIndex - 1; i <= rowIndex + 1; i++) {
    for (let j = columnIndex - 1; j <= columnIndex + 1; j++) {

      // Make sure the mine we are checking exists (sometimes it will overflow)
      if (mineField[i] && mineField[i][j]) {
        currentCell = mineField[i][j];

        // Making sure we haven't already shown it, and it's not a mine.
        if (!currentCell.show && !currentCell.isMine) {
          currentCell.show = true;

          if (currentCell.numAdjacentMines === 0) {
            recursivelyShowAdjacentCells(mineField, currentCell, i, j);
          }
        }
      }
    }
  }
}

/* GLOBAL */

let shouldRestart;

async function start() {
  const mineField = createMineField();

  let nextMove;
  let rowIndex;
  let columnIndex;
  let currentMoveCell;

  while (true) {
    console.log(renderMineField(mineField));

    do {
      nextMove = await question('Enter the row,column where you would like to move next:\n');
    } while (!(/[0-7],[0-7]/).test(nextMove));

    [rowIndex, columnIndex] = nextMove.split(',').map(char => parseInt(char, 10));
    currentMoveCell = mineField[rowIndex][columnIndex];

    if (currentMoveCell.isMine) {

      // Show all the mines if a mine has been selected
      for (const row of mineField) {
        for (const cell of row) {
          if (cell.isMine) cell.show = true;
        }
      }

      console.log(renderMineField(mineField));

      let playAgain;
      do {
        playAgain = await question('You have lost! Play again? (y or n)\n');
      } while (!(/^(y|n)$/i).test(playAgain));

      // TODO: validate playAgain

      if (playAgain === 'y') shouldRestart = true;
      else shouldRestart = false;

      break;
    }
    else {
      currentMoveCell.show = true;

      if (currentMoveCell.numAdjacentMines === 0) {
        recursivelyShowAdjacentCells(mineField, currentMoveCell, rowIndex, columnIndex);
      }

      // Checking to make sure there are non-mine cells left to be shown.
      let complete = true;
      for (const row of mineField) {
        for (const cell of row) {
          if (!cell.show && !cell.isMine) {
            complete = false;
            break;
          }
        }

        if (!complete) break;
      }

      // If there all non-mine cells are shown, player wins!
      if (complete) {
        console.log(renderMineField(mineField));

        let playAgain;
        do {
          playAgain = await question('You won! Play again? (y or n)\n');
        } while (!(/^(y|n)$/i).test(playAgain));

        if (playAgain.toLowerCase() === 'y') shouldRestart = true;
        else shouldRestart = false;

        break;
      }
    }
  }

  if (shouldRestart) await start();
}

start().then(function(_) {
  console.log('Thanks for playing!');
  rl.close();
});
