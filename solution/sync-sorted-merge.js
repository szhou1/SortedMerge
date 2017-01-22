'use strict';
const Heap = require('heap');

module.exports = (logSources, printer) => {

  // a min heap / priority queue that is ordered by earliest log entry first
  var heap = new Heap((a, b) => a.date - b.date);

  // push initial entry for each source into heap
  logSources.forEach((source, i) => {
    pushToHeap(source.pop(), i);
  });

  //******************************************
  // As long as heap is not empty,
  // pop the earliest log entry, print it out
  // get new log entry from the same log source, push that to the heap
  //******************************************
  while (!heap.empty()) {
    const entry = heap.pop();
    printer.print(entry);
    pushToHeap(logSources[entry.sourceId].pop(), entry.sourceId);
  }

  //******************************************
  // Adds source id to the entry before adding to heap because we always
  // need to keep at least 1 entry from each active log source in the heap
  // to ensure all entries are printed chronologically
  //******************************************
  function pushToHeap(entry, index) {
    if (entry) {
      entry['sourceId'] = index;
      heap.push(entry);
    }
  }

  printer.done();

};