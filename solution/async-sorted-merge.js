'use strict'
const P = require('bluebird')
const Heap = require('heap');

module.exports = (logSources, printer) => {

  var heap = new Heap((a,b) => new Date(a.date) - new Date(b.date));

  var totalCounter = 0;

  var sourceLogEntryCounter = {};
  var indexArray = [];
  var activeSources = logSources.map(() => true);

  function promiseWhile() {
    // edge case for when heap is finally empty
    if(heap.empty()) {
      printer.done();
      console.log('my counter', totalCounter);
      return;
    }

  
    var min = heap.peek();

    while(min && sourceLogEntryCounter[min.sourceId] >= 1) {
      printer.print(heap.pop());
      sourceLogEntryCounter[min.sourceId] = sourceLogEntryCounter[min.sourceId] - 1;

      if(sourceLogEntryCounter[min.sourceId] >= 1) {
        min = heap.peek();
      }
    }
    
    // resolve the new entry promise, then push new entry to heap, loop
    return main();

  }

  function pushToHeap(entryArray) {

    entryArray.forEach((entry, i) => {
      var index = indexArray[i];

      if(entry) {
        sourceLogEntryCounter[index] = (sourceLogEntryCounter[index] || 0) + 1;
        totalCounter++;
        
        var newEntry = entry;
        newEntry['sourceId'] = index;
        heap.push(newEntry);
      } else {
        activeSources[index] = false;
      }

    });

    indexArray = [];
  }

  function grabEntriesFromSources() {
    var newEntryPromiseArray = [];

    const COUNTER = logSources.length * 8;

    for(var i = 0, k = 0; i < logSources.length && k < COUNTER; i++, k++) {

      if(activeSources[i]) {
        newEntryPromiseArray.push(logSources[i].popAsync());
        indexArray.push(i);
      }
      
      if(i == logSources.length - 1) {
        i = -1;
      }        
    }

    return newEntryPromiseArray;
  }

  function main() {
    // move inital entries for each source into heap, then call while loop
    P.all(grabEntriesFromSources())
      .then(pushToHeap)
      .then(promiseWhile);
    
  }

  main();
}