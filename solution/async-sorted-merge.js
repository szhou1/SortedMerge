'use strict'
const P = require('bluebird')
const Heap = require('heap');

module.exports = (logSources, printer) => {

  var heap = new Heap((a,b) => new Date(a.date) - new Date(b.date));

  var totalCounter = 0;

  var sourceLogEntryCounter = {};

  function promiseWhile() {
    // console.log('heapsize befor: ', heap.size());
    // edge case for when heap is finally empty
    if(heap.empty()) {
      printer.done();
      console.log('my counter', totalCounter);
      return;
    }
  
    var min = heap.peek();

    while(min && sourceLogEntryCounter[min.sourceId] >= 1) {
      printer.print(heap.pop());
      // console.log(sourceLogEntryCounter[min.sourceId])
      sourceLogEntryCounter[min.sourceId] = sourceLogEntryCounter[min.sourceId] - 1;
      // console.log(sourceLogEntryCounter[min.sourceId])
      if(sourceLogEntryCounter[min.sourceId] >= 1) {
        min = heap.peek();
      }
    }
    
    // console.log('after printing: ', sourceLogEntryCounter);

    // console.log('heapsize after: ', heap.size());
    // resolve the new entry promise, then push new entry to heap, loop
    return main();

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
        // console.log("*******************************************")
        // sourceLogEntryCounter[i] = sourceLogEntryCounter[i] - 1;
      }

    })
  }

  function grabEntriesFromSources() {
    var newEntryPromiseArray = [];

    logSources.forEach((source, i) => {
      newEntryPromiseArray.push(source.popAsync());
    })
    // console.log('after grabbing', sourceLogEntryCounter)
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