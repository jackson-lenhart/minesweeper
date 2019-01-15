'use strict';

function genRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function replicate(str, count) {
  if (count <= 0) return '';
  return str.concat(replicate(str, count - 1));
}

module.exports = { genRandomInt, replicate };
