function updateTitle(data) {
  let container = document.querySelector('.title')
  container.innerHTML = (`<b>Oferta</b>: ${data._source.name} (${data._source.id})`)
}

function update(source) {
  // Compute the flattened node list.
  let nodes = root.descendants();

  let height = Math.max(
    500,
    nodes.length * barHeight + margin.top + margin.bottom
  );

  d3.select('svg')
    .transition()
    .duration(duration)
    .attr('height', height);

  d3.select(self.frameElement)
    .transition()
    .duration(duration)
    .style('height', height + 'px');

  // Compute the "layout". TODO https://github.com/d3/d3-hierarchy/issues/67
  let index = -1;
  root.eachBefore(function(n) {
    n.x = ++index * barHeight;
    n.y = n.depth * 20;
  });

  // Update the nodes…
  let node = svg.selectAll('.node').data(nodes, function(d) {
    return d.id || (d.id = ++i);
  });

  let nodeEnter = node
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', function(d) {
      return 'translate(' + source.y0 + ',' + source.x0 + ')';
    })
    .style('opacity', 0);

  // Enter any new nodes at the parent's previous position.
  nodeEnter
    .append('rect')
    .attr('y', -barHeight / 2)
    .attr('height', barHeight)
    .attr('width', barWidth)
    .style('fill', color)
    .on('click', click);

  nodeEnter
    .append('text')
    .attr('dy', 3.5)
    .attr('dx', 5.5)
    .text(function(d) {
      return `${d.data.value} - ${d.data.description}`;
    });

  // Transition nodes to their new position.
  nodeEnter
    .transition()
    .duration(duration)
    .attr('transform', function(d) {
      return 'translate(' + d.y + ',' + d.x + ')';
    })
    .style('opacity', 1);

  node
    .transition()
    .duration(duration)
    .attr('transform', function(d) {
      return 'translate(' + d.y + ',' + d.x + ')';
    })
    .style('opacity', 1)
    .select('rect')
    .style('fill', color);

  // Transition exiting nodes to the parent's new position.
  node
    .exit()
    .transition()
    .duration(duration)
    .attr('transform', function(d) {
      return 'translate(' + source.y + ',' + source.x + ')';
    })
    .style('opacity', 0)
    .remove();

  // Update the links…
  let link = svg.selectAll('.link').data(root.links(), function(d) {
    return d.target.id;
  });

  // Enter any new links at the parent's previous position.
  link
    .enter()
    .insert('path', 'g')
    .attr('class', 'link')
    .attr('d', function(d) {
      let o = { x: source.x0, y: source.y0 };
      return diagonal({ source: o, target: o });
    })
    .transition()
    .duration(duration)
    .attr('d', diagonal);

  // Transition links to their new position.
  link
    .transition()
    .duration(duration)
    .attr('d', diagonal);

  // Transition exiting nodes to the parent's new position.
  link
    .exit()
    .transition()
    .duration(duration)
    .attr('d', function(d) {
      let o = { x: source.x, y: source.y };
      return diagonal({ source: o, target: o });
    })
    .remove();

  // Stash the old positions for transition.
  root.each(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}

function color(d) {
  return d._children ? '#3182bd' : d.children ? '#c6dbef' : '#fd8d3c';
}

function updateData(data) {
  updateTitle(data)
  let explainStr = JSON.stringify(data._explanation);
  explainStr = explainStr.replace(/"details":/g, '"children":');
  root = d3.hierarchy(JSON.parse(explainStr));
  root.x0 = 0;
  root.y0 = 0;
  update(root);
}


let fileName = 'example.json';

let margin = { top: 30, right: 20, bottom: 30, left: 20 },
  width = window.innerWidth - 366,
  barHeight = 20,
  barWidth = (width * 0.5 - margin.left - margin.right) * 0.95;

let i = 0,
  duration = 400,
  root;

let diagonal = d3
  .linkHorizontal()
  .x(function(d) {
    return d.y;
  })
  .y(function(d) {
    return d.x;
  });

let offerName = '';

let svg = d3
  .select('#graph')
  .append('svg')
  .attr('width', width) // + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

d3.json(fileName, function(error, data) {
  if (error) throw error;
  updateData(data);
});

let textarea = document.querySelector('.query');
let updateButton = document.querySelector('.update-btn')

updateButton.addEventListener('click', () => {
  try {
    let data = JSON.parse(textarea.value);
    updateData(data);
  } catch (e) {
    alert('Error parsing JSON');
  }
})