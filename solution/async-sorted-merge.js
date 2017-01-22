'use strict';
const P = require('bluebird');
const Heap = require('heap');

module.exports = (logSources, printer) => {

  // a min heap / priority queue that is ordered by earliest log entry first
  var heap = new Heap((a, b) => a.date - b.date);

  // the number of log entries to grab each time
  const BATCH_SIZE = logSources.length * 8;

  // because we are batching and we need to keep track of the source id,
  // this array holds a list of source indices that pair with newEntryPromiseArray
  var indexArray = [];

  // keep track of how many log entries from each log source are inside the heap
  // [3, 1, 0] means 3 entries from source 0, 1 entry from source 1, 0 entries from source 0
  var sourceLogEntryCounter = {};

  // keep track of log sources that already depleted so we do not perform tasks on them
  var activeSources = logSources.map(() => true);

  //********************************************
  // A recursive function that
  // prints as many entries as it can
  // grabs a new batch of log entry promises
  // waits for all of them to resolve asynchronously
  // pushes new entries to heap
  // repeat
  //********************************************
  function promiseWhile() {

    // case for when heap is finally empty
    if (heap.empty()) {
      printer.done();
      return;
    }

    // get the most recent log entry and as long as there is another log entry
    // from the same source in the heap, print it.
    var min = heap.peek();

    while (min && sourceLogEntryCounter[min.sourceId] >= 1) {
      printer.print(heap.pop());
      sourceLogEntryCounter[min.sourceId] = sourceLogEntryCounter[min.sourceId] - 1;

      if (sourceLogEntryCounter[min.sourceId] >= 1) {
        min = heap.peek();
      }
    }
    
    return main();

  }

  //******************************************
  // Pushes each log entry into heap after adding the sourceId
  //******************************************
  function pushToHeap(entryArray) {

    entryArray.forEach((entry, i) => {
      var index = indexArray[i];

      if (entry) {
        sourceLogEntryCounter[index] = (sourceLogEntryCounter[index] || 0) + 1;
        
        var newEntry = entry;
        newEntry['sourceId'] = index;
        heap.push(newEntry);
      } else {
        activeSources[index] = false;
      }

    });

  }

  //******************************************
  // Grabs new log entries from log sources based on batch size
  //******************************************
  function grabEntriesFromSources() {
    
    var newEntryPromiseArray = [];
    indexArray = [];

    for (var i = 0, k = 0; i < logSources.length && k < BATCH_SIZE; i++, k++) {

      if (activeSources[i]) {
        newEntryPromiseArray.push(logSources[i].popAsync());
        indexArray.push(i);
      }

      if (i === logSources.length - 1) {
        i = -1;
      }        
    }

    return newEntryPromiseArray;
  }

  //******************************************
  // grabs initial batch of log entry promises
  // waits for all of them to resolve asynchronously, returns an array of LogEntries
  // pushes new entries to heap
  // call recursive function to repeat this process
  //******************************************
  function main() {
    P.all(grabEntriesFromSources())
      .then(pushToHeap)
      .then(promiseWhile);
  }

  // initial function call
  main();
};