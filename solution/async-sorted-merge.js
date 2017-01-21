'use strict'
const P = require('bluebird')
const Heap = require('heap');

module.exports = (logSources, printer) => {

  var heap = new Heap((a,b) => new Date(a.date) - new Date(b.date));

  var totalCounter = 0;

  var sourceLogEntryCounter = {};
  var indexArray = [];

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
      var index = indexArray[i];

      if(entry) {
        sourceLogEntryCounter[index] = (sourceLogEntryCounter[index] || 0) + 1;
        totalCounter++;
        
        var newEntry = entry;
        newEntry['sourceId'] = index;
        heap.push(newEntry);
      } 

    });
  }

  function grabEntriesFromSources() {
    var newEntryPromiseArray = [];
    const COUNTER = logSources.length * 10;

    for(var i = 0, k = 0; i < logSources.length && k < COUNTER; i++, k++) {
      // console.log(i , k)
      newEntryPromiseArray.push(logSources[i].popAsync());
      indexArray.push(i);

      if(i == logSources.length - 1) {
        i = -1;
      }
    }

    // console.log(newEntryPromiseArray.length)
    // logSources.forEach(source => {
    //   newEntryPromiseArray.push(source.popAsync());
    // })
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