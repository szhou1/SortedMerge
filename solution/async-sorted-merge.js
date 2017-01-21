'use strict'
const P = require('bluebird')
const Heap = require('heap');

module.exports = (logSources, printer) => {

  var heap = new Heap((a,b) => {
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);
    return aDate - bDate;
  });

  var totalCounter = 0;

  var sourceLogEntryCounter = {};

  function promiseWhile() {
    console.log('heapsize befor: ', heap.size());
    // edge case for when heap is finally empty
    if(heap.empty()) {
      printer.done();
      console.log(totalCounter)
      return;
    }
  
    var min = heap.peek();

    while(min && sourceLogEntryCounter[min.sourceId] > 1) {
      printer.print(heap.pop());
      // console.log(sourceLogEntryCounter[min.sourceId])
      sourceLogEntryCounter[min.sourceId] = sourceLogEntryCounter[min.sourceId] - 1;
      // console.log(sourceLogEntryCounter[min.sourceId])
      min = heap.peek();
    }

    if(min && sourceLogEntryCounter[min.sourceId] == 1) {
      printer.print(heap.pop());
      sourceLogEntryCounter[min.sourceId] = sourceLogEntryCounter[min.sourceId] - 1;
    }
    
    console.log('after printing: ', sourceLogEntryCounter);

    console.log('heapsize after: ', heap.size());
    // resolve the new entry promise, then push new entry to heap, loop
    return P.all(grabEntriesFromSource())
            .then(pushToHeap)
            .then(promiseWhile);

  }

  function pushToHeap(entryArray) {
    entryArray.forEach((entry, i) => {

      var newEntry = entry;
      if(entry) {
      sourceLogEntryCounter[i] = (sourceLogEntryCounter[i] || 0) + 1;
        totalCounter++;
        newEntry['sourceId'] = i;
        heap.push(newEntry);
      } else {
        console.log("*******************************************")
        // sourceLogEntryCounter[i] = sourceLogEntryCounter[i] - 1;
      }

    })
  }

  function grabEntriesFromSource() {
    var newEntryPromiseArray = [];

    logSources.forEach((source, i) => {
      newEntryPromiseArray.push(source.popAsync());
    })
    console.log('after grabbing', sourceLogEntryCounter)
    return newEntryPromiseArray;
  }

  // move inital entries for each source into heap, then call while loop
  P.all(grabEntriesFromSource())
    .then(pushToHeap)
    .then(promiseWhile);

}