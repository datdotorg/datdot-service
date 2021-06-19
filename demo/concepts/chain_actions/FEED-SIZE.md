# FEED SIZE
```js
function getSize (ranges) { // [[0,3], [5,8], [10,14]]
  var size = 0
  for (var i = 0; i < ranges.length; i++) { size = size + (ranges[i][1] - ranges[i][0]) } // [0,3]
  return size*64 // each chunk is 64kb
}
```
for all the chunks of one feed in a plan

## usage
```js

  for (var i = 0; i < feeds.length; i++) {
    const size = getSize(feeds[i].ranges)
    feeds[i].size = size
  }
```

# chain
* TODO make attestor or maybe encoder maybe go check the actual feed size
