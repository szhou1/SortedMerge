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

  logSources.forEach(source => {
    entriesArray.push(source.popAsync())
  })

  var newEntryPromise;

  var currentSourceId = 0;

  function promiseWhile() {

    // edge case for when heap is finally empty
    if(heap.empty()) {
      printer.done()
      return;
    }
  
    // pop off most recent entry, print it out
    var entry = heap.pop();
    printer.print(entry);
    
    // keep track of most recent source id
    currentSourceId = entry.sourceId;

    // get next entry from last source id
    newEntryPromise = logSources[currentSourceId].popAsync();

    // resolve the new entry promise, then push new entry to heap, loop
    return P.resolve(newEntryPromise)
            .then(e => {
              pushToHeap(e, currentSourceId);
            })
            .then(promiseWhile);

  }

  function pushToHeap(entry, currentSourceId) {
    var newEntry = entry;
    if(entry) {
      newEntry['sourceId'] = currentSourceId;
      heap.push(newEntry);
    }
  }

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