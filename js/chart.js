const nodes_to_create = 65;
const maxX = Math.floor(Math.random() * (Math.floor(10000) - Math.ceil(1000)) + Math.ceil(1000));
const maxY = Math.floor(Math.random() * (Math.floor(1000) - Math.ceil(90)) + Math.ceil(90));

var axisXmaxDomain = 0;

var axisYmaxDomain = 0;
var axisYminDomain = maxY / 2 * 0.85;

var radiusMaxDomain = 0;
var radiusMinDomain = 3;

const margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 50
  },
  width = 550 - margin.left - margin.right,
  height = 460 - margin.top - margin.bottom;

var nodes = [], links = [];

let first_iteration_complete = false;

var svg, x, y, z, color, tooltip, moveTooltip, hideTooltip;

function generate_svg_base(){
  svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  let x_incriments = d3.nice(0, axisXmaxDomain, 6);

  let x_round = x_incriments[1];

  let x_divisor = 1;

  while (Math.ceil(Math.log10(Math.floor(axisXmaxDomain) + 1)) - 1 != Math.ceil(Math.log10(x_divisor + 1))) {
    x_divisor *= 10
  }

  if (Math.ceil(axisXmaxDomain / x_divisor) * x_divisor >= x_incriments[1]) {
      x_round += d3.tickStep(0, axisXmaxDomain, 10)
  }

  let x_final =  d3.nice(0, x_round, 6);

  x = d3.scaleLinear()
    .domain([0, x_final[1]])
    .range([0, width - 10]);

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  let y_incriments = d3.nice(axisYminDomain, axisYmaxDomain, 10);

  let y_round = y_incriments[1];

  let y_divisor = 1;

  while (Math.ceil(Math.log10(Math.floor(axisYmaxDomain) + 1)) - 1 != Math.ceil(Math.log10(y_divisor + 1))) {
    y_divisor *= 10
  }

  if (Math.ceil(axisYmaxDomain / y_divisor) * y_divisor >= y_incriments[1]) {
      y_round += d3.tickStep(axisYminDomain, axisYmaxDomain, 10)
  }

  let y_final = d3.nice(axisYminDomain, y_round, 10)

  y = d3.scaleLinear()
    .domain([axisYminDomain, y_final[1]])
    .range([height, 10])

  svg.append("g")
    .call(d3.axisLeft(y));

  z = d3.scaleLinear()
    .domain([0, radiusMaxDomain]) // shold be set by max value in data
    .range([4, 36]);

    const color_scale = (axisXmaxDomain / axisYmaxDomain) / 10;

    color = d3.scaleLinear()
      .domain([0, color_scale, color_scale * 2])
      .range(["green", "orange", "red"]);

    tooltip = d3.select("#tooltip")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "black")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("color", "white")
      .style("width", "max-content")
      .style("position", "relative");

    moveTooltip = (event) => {
      tooltip
        .style("left", (event.pageX) + 25 + "px")
        .style("top", (event.pageY - height - 75) + "px");
    }

    hideTooltip = (event) => {
      tooltip
        .transition()
        .duration(200)
        .style("opacity", 0);
    }

    showTooltip = (event, node) => {
      tooltip
        .transition()
        .duration(200);

      tooltip
        .style("opacity", 1)
        .html("Info: " + node.name)
        .style("left", (event.pageX) + 25 + "px")
        .style("top", (event.pageY - height - 75) + "px");
    }
}

function render_nodes_and_links() {
  d3.selectAll('.nodes').remove();
  d3.selectAll('.lines').remove();
  d3.selectAll('.y_label').remove();
  d3.selectAll('.x_label').remove();

  if (!first_iteration_complete) {
    generate_svg_base()
  }

  first_iteration_complete = true;

  const lines = svg
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr("class", "lines");

  const circles = svg
    .selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr("class", "nodes")
    .attr("id", node => (node.id))
    .style("fill", node => color(x(node.x_axis) / y(node.y_axis)))
    .attr('r', node => z(node.radius))
    .attr("cx", node => x(node.x_axis))
    .attr("cy", node => y(node.y_axis))
    .on("mouseover", showTooltip)
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip)
    .call(d3.drag().on("start", started));

  const simulation = d3.forceSimulation(nodes)
    .force('x', d3.forceX(node => x(node.x_axis)).strength(0.2))
    .force('y', d3.forceY(node => y(node.y_axis)).strength(0.2));

  function started(event) {
    const circle = d3.select(this).classed("dragging", true);

    event.on("drag", dragged).on("end", ended);

    function dragged(event, node) {
      simulation.force(
          'link',
          d3.forceLink(links).strength(1).distance(100)
        ).alpha(.4);

      circle.raise().attr("cx", node.x = event.x).attr("cy", node.y = event.y);
    }

    function ended() {
      simulation
        .force('x', d3.forceX(node => x(node.x_axis)).strength(1))
        .force('y', d3.forceY(node => y(node.y_axis)).strength(1));

      circle.classed("dragging", false);
    }
  }

  simulation.on('tick', () => {
    circles.attr('cx', node => node.x).attr('cy', node => node.y);

    lines
      .attr('x1', link => link.source.x)
      .attr('y1', link => link.source.y)
      .attr('x2', link => link.target.x)
      .attr('y2', link => link.target.y);
  });

  svg.append("text")
    .attr("class", "y_label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("x", - 10)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("axisY Label (numbers)")
    .attr("font-size", 13);

  svg.append("text")
    .attr("class", "x_label")
    .attr("text-anchor", "end")
    .attr("x", width - 10)
    .attr("y", height - 6)
    .text("axisX Label (larger numebrs)")
    .attr("font-size", 13);}

const xBuffer =  maxX / 10;

const yBuffer = maxY / 2;

function randSize() {
  return Math.floor(Math.random() * (Math.floor(100) - Math.ceil(0)) + Math.ceil(0));
}

function randX() {
  return Math.floor(Math.random() * (Math.floor(maxX) - Math.ceil(xBuffer)) + Math.ceil(xBuffer));
}

function randY() {
  return Math.floor(Math.random() * (Math.floor(maxY) - Math.ceil(yBuffer)) + Math.ceil(yBuffer));
}

function build_modify_JSON() {
  if (!first_iteration_complete) {
    for (let i = 0; i < nodes_to_create; i++) {
      const things = ['Impressive Stat', 'Im a Bubble!', 'Certainly', "Yep!", "Metric", "Wordzz"];

      const thing = things[Math.floor(Math.random() * things.length)];

      let randx = randX(), randy = randY(), randsize = randSize();

      if (i <= (nodes_to_create / 4) || i >= (nodes_to_create / 4) * 3) {

        if (randsize > radiusMaxDomain) {
          radiusMaxDomain = randsize;
        }

        if (randx > axisXmaxDomain) {
          axisXmaxDomain = randx;
        }

        if (randy > axisYmaxDomain) {
          axisYmaxDomain = randy;
        }

        nodes.push({
          id: "node" + i,
          name: thing,
          x_axis: randx,
          y_axis: randy,
          radius: randsize
        });
      } else {
        nodes.push({
          id: "node" + i,
          name: thing,
          x_axis: (i - nodes_to_create / 4) * ((axisXmaxDomain - (xBuffer + (radiusMaxDomain - radiusMinDomain) / 2)) / (nodes_to_create / 2)) + xBuffer + (randSize() / 5),
          y_axis: (i - nodes_to_create / 4) * ((axisYmaxDomain - ((radiusMaxDomain - radiusMinDomain) / 2)) / (nodes_to_create)) + yBuffer + (randSize() / 5),
          radius: randsize
        });
      }
    }

    for (let i = 0; i < nodes_to_create - 1; i++) {
      links.push({
        source: nodes[i],
        target: nodes[i + 1]
      })
    }
  } else {
    for (let i = 0; i < nodes_to_create; i++) {
      nodes[i].radius = randSize();
    }
  }

  render_nodes_and_links();
}

build_modify_JSON();

setInterval(function() {
  build_modify_JSON();
}, 3000);
