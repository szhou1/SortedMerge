'use strict'
const P = require('bluebird')
const Heap = require('heap');

module.exports = (logSources, printer) => {

  var heap = new Heap((a,b) => {
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);
    return aDate - bDate;
  });

  // move inital entries for each source into array
  var entriesArray = [];
  var arr = [];

  var sourceLogEntryCounter = {};

  logSources.forEach(source => {
    entriesArray.push(source.popAsync())
  })

  var newEntryPromiseArray = [];
  var indexArray = [];

  const CONCURRENT_ENTRIES = 100;

  function promiseWhile() {

    // edge case for when heap is finally empty
    if(heap.empty()) {
      printer.done()
      return;
    }
  
    // pop off most recent entry, print it out
    var entry;

    var min = heap.peek();

    while(min && sourceLogEntryCounter[min.sourceId] > 0) {

      entry = heap.pop();
      printer.print(entry);
      sourceLogEntryCounter[min.sourceId] = sourceLogEntryCounter[min.sourceId] - 1;
      min = heap.peek();
    }
    
    // get next entry from last source id
    newEntryPromiseArray = [];
    indexArray = [];

    for(var i = 0, counter = 0; i < logSources.length && counter < CONCURRENT_ENTRIES; i++, counter++) {
      var entryPromise = logSources[i].popAsync();
      newEntryPromiseArray.push(entryPromise);
      indexArray.push(i);

      sourceLogEntryCounter[i] = (sourceLogEntryCounter[i] || 0) + 1;

      if(i == logSources.length - 1) i = 0;
    }

    // console.log(newEntryPromiseArray.length)
    // console.log(heap.size())

    // resolve the new entry promise, then push new entry to heap, loop
    return P.all(newEntryPromiseArray)
            .then(e => {
              pushToHeap(e);
            })
            .then(promiseWhile);

  }

  function pushToHeap(entryArray) {
    entryArray.forEach((entry, i) => {

      var newEntry = entry;
      if(entry) {
        newEntry['sourceId'] = indexArray[i];
        heap.push(newEntry);
      }

    })
  }

  // function grabEntriesFromSource(sourceId, count) {
  //   var entryPromises = [];
  //   for(var i = 0; i < count; i++) {
  //     entryPromises.push(logSources[sourceId].popAsync());
  //   }
  //   return entryPromises;
  // }

  // resolve all initial entries
  P.all(entriesArray)
    .then(initialEntries => {
      // push all resolved initial entries into heap
      initialEntries.forEach((entry, i) => {
        var newEntry = entry;
        newEntry['sourceId'] = i;
        heap.push(newEntry);
      });
      // console.log(heap)
    })
    .then(promiseWhile)

}