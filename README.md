Merging Logs
============

See https://docs.google.com/document/d/1A6wH-Hifd2uAcaNBMDE4iUH4NBCs6u8vjnkbDWMU8h0/edit for instructions.


###Analysis:

##sync:

Using an array to store the log entries, sort, then print them out is not practical because we can have a million log sources and each log source can have a million log entries, we can end up storing terabytes worth of log entries into memory.
Using a min heap / min priority queue to store log entries is the way to go because we can keep only what we need at the moment, which is at least 1 log entry from each log source. Additionally, inserting and removing log entries from the heap takes log(n) time. And because it guarantees to have the earliest log entry at the top of the heap, we can, in constant time, retrieve it and print it out.
The heap will keep a log entry for each log source. If log entry E from source S is the min of the heap, we will pop E, then immediately get the next log entry from source S.

##async:

Now that every log entry will have a slight delay, the order in which they resolve might not be in chronological order. To ensure chronological order, we will use Promise.all() which takes in an array of LogEntry promises and returns ONLY once they have all resolved. Then after all of those log entries have been added to the heap, start poping from the heap and printing them out. 

Popping from heap and printing works differently from the sync version. Before popping the min log entry from heap, the algorithm first checks if heap contains another log entry from the same source. And as long as that is true, it pops and prints the min.

#Optimizations:

1. Large batch processing - The main bottleneck with the above approach is waiting for Promise.all() to resolve. If we can reduce the number of times Promise.all() is called, it should speed it up. Each time the algorithm gets new log entries, it fetches them by a specific factor > 1.
2. Ignore Drained Sources - if we have a lot of sources, the algorithm will eventually get to a point where it will be popping from sources that are empty (getting promises that resolve to false), which will have a delay, which then will be caught and thrown out later. To prevent this superfluous work, an additional array is created to keep track of the status of each log source. When grabbing new log entries from sources, if the source is indicated as drained, then it is simply ignored.
