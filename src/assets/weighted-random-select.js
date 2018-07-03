// ported from: http://stackoverflow.com/questions/2140787/select-random-k-elements-from-a-list-whose-elements-have-weights

// each node in the heap has a value, weight, and totalWeight
// the totalWeight is the weight of the node plus any children
var NodeObj = {};
var newNode = function (value, weight, totalWeight) {
  var node = Object.create(NodeObj);
  node.value = value;
  node.weight = weight;
  node.totalWeight = totalWeight;
  return node;
};

// h is the heap, it's like a binary tree that lives in an array
// it has a node for each pair in #items.  h[1] is the root.  Each
// other node h[i] has a parent at h[i >> 1].  To get this nice simple
// arithmetic, we have to leave h[0] vacant.
var rwsHeap = function (items) {
  // Leave h[0] vacant
  var h = [undefined], weight;
  for (var value in items) {
    weight = items[value];
    h.push(newNode(value, weight, weight));
  }
  // Total up the total weights (add h[i]'s total to the parent)
  for (var i = h.length - 1; i > 1; i--) {
    h[i >> 1].totalWeight += h[i].totalWeight;
  }
  return h;
};

var rwsHeapPop = function (h) {
  // Start with a random amount of gas
  return rwsHeapPopSpecific(h, h[1].totalWeight * Math.random());
};

var rwsHeapPopSpecific = function (h, gas) {
  var i = 1;
  // Start driving at the root
  // While we have enough gas to go past node i
  while (gas >= h[i].weight) {
    gas -= h[i].weight;
    i = i << 1;
    // Move to the first child
    // If we have enough gas, drive past first child and descendents
    // And to the next child
    if (gas >= h[i].totalWeight) {
      gas -= h[i].totalWeight;
      i += 1;
    }
  }
  // h[1] is the selected node
  var w = h[i].weight;
  var v = h[i].value;
  // Make sure h[i] is not chosen again
  h[i].weight = 0;
  // And clean up the total weights to re-distribute
  while (i !== 0) {
    h[i].totalWeight -= w;
    i = i >> 1;
  }
  // Return the selected element
  return v;
};

var rwsHeapSample = function (h) {
  // Start with a random amount of gas
  return rwsHeapPopSpecific(h, h[1].totalWeight * Math.random());
};

var rwsHeapSampleSpecific = function (h, gas) {
  var i = 1;
  // Start driving at the root
  // While we have enough gas to go past node i
  while (gas >= h[i].weight) {
    gas -= h[i].weight;
    i = i << 1;
    // Move to the first child
    // If we have enough gas, drive past first child and descendents
    // And to the next child
    if (gas >= h[i].totalWeight) {
      gas -= h[i].totalWeight;
      i += 1;
    }
  }
  // h[i] is the selected node
  return h[i].value;
};

// Create a heap and select #n elements from it
// @return array of selected elements
var randomWeightedSampleNoReplacement = function (items, n) {
  var h = rwsHeap(items);
  var sel = [];
  var totalItems = Object.keys(items).length;
  for (var i = 0; i < n && i < totalItems; i++) {
    sel.push(rwsHeapPop(h));
  }
  return sel;
};

//
// Test
//

var test_rwsHeap = function () {
  var insertData = function (n) {
    var result = {};
    for (i = 0; i < n; i++) result[i] = 1;
    return result;
  };

  var testUniqueResultsFromHeap = function (data) {
    var set = {};
    var heap = rwsHeap(data);
    for (var i in data)
      set[rwsHeapSampleSpecific(heap, i)] = undefined;
    return Object.keys(set).length;
  };

  for (i = 1; i <= 100; i++) {
    var actualValue = testUniqueResultsFromHeap(insertData(i));
    if (actualValue != i) {
      console.log('rwsHeap test failed with heap size ' + i +
        '; only ' + actualValue + ' unique values returned');
      return;
    }
  }

  console.log('rwsHeap test passed');
};
