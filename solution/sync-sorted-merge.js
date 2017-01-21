'use strict'
const Heap = require('heap');

module.exports = (logSources, printer) => {

  var heap = new Heap((a,b) => new Date(a.date) - new Date(b.date));

  // push initial entry for each source into heap
  logSources.forEach((source, i) => {
    var entry = source.pop();
    entry['sourceId'] = i;
    heap.push(entry);
  });


  while(!heap.empty()) {
    const entry = heap.pop();
    printer.print(entry)

    var newEntry = logSources[entry.sourceId].pop();
    // console.log("new", newEntry);
    if(newEntry) {
      newEntry['sourceId'] = entry.sourceId;
      heap.push(newEntry);
    }
  }

  printer.done();

}