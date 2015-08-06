'use strict'
/* To do

 * When move to main code -> use props model to save the states????
 * Make functions -> get next node, etc
 * Impliment recusive code for linkages

 * Make sankey data linkage based
*/


const React = require('react/addons');
const d3 = require('d3')
require('./vendor/sankey')
const _ = require('lodash')
var $ = require('jquery');


var SankeyComponent = React.createClass({
	propTypes: {
		sankey: React.PropTypes.object.isRequired,
		height: React.PropTypes.number.isRequired,
		width: React.PropTypes.number.isRequired
	},

	processData() {
		const graph = _.clone(this.props.sankey.data, true);
		const nodeMap = {};
	  graph.nodes.forEach(function(x) { 
	    nodeMap[x.name] = x;
	  });

    const max = d3.max(graph.links, (x) => {
      return x.value
    })
    const min = d3.min(graph.links, (x) => {
      return x.value
    })
    console.log('scale', min, max)

    var scale = d3.scale.linear()//tried using a log scale
      .domain([min, max])
      .range([min, max])

	  graph.links = graph.links.map(function(x) {
	    return {
	      source: nodeMap[x.source],
	      target: nodeMap[x.target],
	      value: x.value//scale(x.value)
	    };
	  });

	  return graph
	},

  findAdjacentLinks(startUIUD, endUIUD) {
    const target = startUIUD + '_' + endUIUD
    const linkages = this.props.sankey.linkages

    const linksOfInterestUnFiltered = _.map(linkages, (value, linkage) => {
      if(_.includes(linkage, (target))){
        return linkage
      }
    })
    const linksOfInterest = _.filter(linksOfInterestUnFiltered, (link) => {
      return typeof link !== 'undefined'
    })
    const adjacentLinks =  _.map(linksOfInterest, (link) => {
      const linesMinusOrigin = link.replace(new RegExp(target, "g"), '')
      const targetNodeUIUDs = _.filter(linesMinusOrigin.split('_'), (UIUD) => UIUD !== '')
      return _.map(targetNodeUIUDs, (UIUD) => {
        return {link: UIUD, value: linkages[link]}
      })
    })
    return _.flattenDeep(adjacentLinks)
  },

	//ought to have render + updateChart methods
  destroyChart() {
    d3.select('#chart svg').remove();
  },
	createChart(w, h) {
		const units = "unit";
		const self = this
     
    const margin = {top: 20, right: 20, bottom: 20, left: 20}
    const width = w - margin.left - margin.right
    const height = h - margin.top - margin.bottom
    const linkColor = '#cbe3f3';
    const rectColor = '#102b3f';
     
    const formatNumber = (d) => {return d}
    const format = (d) =>  { return formatNumber(d) + " " + units; }
    const cleanStr = (str) => {
      return 'a' + str.replace(/ /g,'').replace(/\W/g, '').toLowerCase()
    }
    //reverse is for when going backwards in terms of linkages...
    const getLinkIdentity = (name1, name2, reverse) => {
      if(reverse)
        return cleanStr(name2) + '_' + cleanStr(name1);
      return cleanStr(name1) + '_' + cleanStr(name2);
    }
     
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
     
    var graph = this.processData()

    // Set the sankey diagram properties
    var sankey = d3.sankey()
      .nodeWidth(10)
      .nodePadding(2)
      .size([width, height])
      .nodes(graph.nodes) //Where the rects are located
      .links(graph.links) //Thing that connects the nodes together
      .layout(32);
    var path = sankey.link(); 

    const defineAttributes = (d) => {
      //defining other attributes as early as possible
      //check to see if item is contained within to reduce redefining
      if('color' in d.source === false){
        d.source.color = rectColor; 
      }
      if('color' in d.target === false){
        d.target.color = rectColor;
      }
    }
    const moveLinksToTop = (d) => {
      //moving non selected links to the back to prevent overlap issues
      svg.selectAll(".link").sort(function (a, b) { 
        if (d.indexOf(a.dy) === -1) return -1;
        else return 1;
      });
    }

    // add in the links
    var link = svg.append("g").selectAll(".link")
      .data(graph.links)
      .enter().append("path");

    link.each(function(d) {
        defineAttributes(d)
      })
      .attr('class', function(d){
        var backwards = ''
        if(d.target.x < d.source.x)
          backwards = 'backwards'
        return 'link ' + getLinkIdentity(d.source.name, d.target.name) + ' ' + backwards;
      })
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .style('stroke', linkColor)
      .style('fill', 'none')
      .style('stroke-opacity', .5)
      .sort(function(a, b) { return b.dy - a.dy; })
      .on('mouseover', function(d){ //Currently works going right, not left
        moveLinksToTop([d.dy])

        //node.addSideNodes(d, 'source')
        //node.addSideNodes2(d.target)

        d3.selectAll('.rect').style('fill', 'gray')
        d3.selectAll('.text').style('fill', 'white').attr('visibility', 'hidden')
        d3.selectAll('.link')
          .style('stroke', 'gray')
          .style('stroke-opacity', .1)
        const bbox = this.getBBox()
        const slopeDown = d.source.y < d.target.y

        svg.append('circle')
          .attr('cx', bbox.x + bbox.width / 2)
          .attr('cy', bbox.y + bbox.height / 2)
          .attr('fill', 'orange')
          .attr('stroke', 'black')
          .attr('r', 5)

        //var colOrigin = d.source.col/2 + d.target.col/2
        d3.select(this).style('stroke', 'cadetblue').style('stroke-opacity', .5)

        linkage.drawLinks(d)
        
      })
      .on('mouseout', function(d){
        revertToOriginal()
        //d3.selectAll('svg').attr('pointer-events', 'none')
      })

    const linkage = {}
    //adding sideNodes should be done when sublinks are drawn
    linkage.drawSublinksBackwards = (d, node) => {
      var totalInputWidth = d.source.dy
      var widthOfSelected = 'temp_dy' in d ? d.temp_dy : d.dy
      const adjacentLinks = self.findAdjacentLinks(d.source.UIUD, d.target.UIUD)
      nodes.addSideNodes(d, 'source')

      const total = _.reduce(adjacentLinks, (sum, adjacentLink) => {
        const targetNames = _.map(d.source.targetLinks, (link) => link.source.UIUD)
        if(_.includes(targetNames, adjacentLink.link))
          return sum + adjacentLink.value
        return sum
      }, 0)

      _.forEach(d.source.targetLinks, function(linkNotClone) { //draws each link
        var target = _.find(adjacentLinks, (adjacentLink) => {
          return linkNotClone.source.UIUD === adjacentLink.link
        })

        if(typeof target !== 'undefined'){
          link = _.clone(linkNotClone, true)
          var offset = 0
          offset = d.sy //This only works when going backwards...

          var unmutated_link_dy = _.clone(link.dy)
          link.dy = link.dy * target.value / link.value
          link.source.y = link.source.y + unmutated_link_dy * offset/totalInputWidth
          link.target.y = link.target.y + unmutated_link_dy * offset/totalInputWidth

          //This is to find the total of linkages in for non adjacent nodes
          var nodeTotal = 0 
          if(typeof node !== 'undefined'){
            _.forEach(node.targetLinks, (targetlink) => {
              const adjacentLinks = self.findAdjacentLinks(targetlink.source.UIUD, node.UIUD)
              var target = _.find(adjacentLinks, (adjacentLink) => {
                return link.source.UIUD === adjacentLink.link
              })
              if(typeof target !== 'undefined'){
                nodeTotal += target.value
              }
            })
          }

          d3.select('.' + getLinkIdentity(link.target.UIUD, target.link, true))
            .style('stroke', 'gray')
            .style('stroke-opacity', .1)

          linkage.colouring(link)
          nodes.addSideNodes(link, 'source')

          const val = nodeTotal === 0 ? target.value : nodeTotal
          const origin = typeof node !== 'undefined' ? node.value : total

          d3.select('.text.' + cleanStr(link.source.UIUD))
            .text(function(d) { return d.name + ' (' + format(val) + '/' + format(d.value) + ') - ' + (val/d.value*100).toFixed(2) + '%'; })
          d3.select('.text.' + cleanStr(link.target.UIUD))
            .text(function(d) { return d.name + ' (' + format(total) + '/' + format(d.value) + ') - ' + (total/d.value*100).toFixed(2) + '%'; })
          d3.select('.text.' + cleanStr(d.target.UIUD))
            .text(function(d) { return d.name + ' (' + format(origin) + '/' + format(d.value) + ') - ' + (origin/d.value*100).toFixed(2) + '%'; })

          svg.append('path')
            .attr('class', function(d){
              return 'tempLink ' + getLinkIdentity(link.target.UIUD, target.link, true)
            })
            .attr('d', path(link))
            .style("stroke-width", Math.max(1, link.dy))
            .sort(function(a, b) { return b.dy - a.dy; })
            .style('stroke', 'teal')
            .style('fill', 'none')
            .style('stroke-opacity', .5)
        }
      })
    }
    linkage.drawSublinks = (d, node) => {
      var totalInputWidth = d.target.dy
      var widthOfSelected = 'temp_dy' in d ? d.temp_dy : d.dy
      const adjacentLinks = self.findAdjacentLinks(d.source.UIUD, d.target.UIUD)
      nodes.addSideNodes(d, 'target')

      const total = _.reduce(adjacentLinks, (sum, adjacentLink) => {
        const targetNames = _.map(d.target.sourceLinks, (link) => link.target.UIUD)
        if(_.includes(targetNames, adjacentLink.link))
          return sum + adjacentLink.value
        return sum
      }, 0)
      _.forEach(d.target.sourceLinks, function(linkNotClone) {
        var target = _.find(adjacentLinks, (adjacentLink) => {
          return linkNotClone.target.UIUD === adjacentLink.link
        })

        if(typeof target !== 'undefined'){
          link = _.clone(linkNotClone, true)
          var offset = 0
          _.forEach(link.source.targetLinks, function(selectLinkCol) {
            if(d.source.UIUD == selectLinkCol.source.UIUD){
              return false
            }
            offset += selectLinkCol.dy
          }, 0)
          
          link.target.y += link.dy * offset/totalInputWidth
          link.source.y += link.dy * offset/totalInputWidth
          link.dy = link.dy * target.value / link.value;

          //This is to find the total of linkages in for non adjacent nodes
          //Issues with going forwards
          var nodeTotal = 0 
          if(typeof node !== 'undefined'){
            _.forEach(node.sourceLinks, (sourcelink) => {
              const adjacentLinks = self.findAdjacentLinks(node.UIUD, sourcelink.target.UIUD)
              var source = _.find(adjacentLinks, (adjacentLink) => {
                return link.target.UIUD === adjacentLink.link
              })
              if(typeof source !== 'undefined'){
                nodeTotal += source.value
              }
            })
          }

          d3.select('.' + getLinkIdentity(link.source.UIUD, target.link))
            .style('stroke', 'gray')
            .style('stroke-opacity', .1)

          linkage.colouring(link)
          nodes.addSideNodes(link, 'target')

          const val = nodeTotal === 0 ? target.value : nodeTotal
          const origin = typeof node !== 'undefined' ? node.value : total

          d3.select('.text.' + cleanStr(link.source.UIUD))
            .text(function(d) { return d.name + ' (' + format(total) + '/' + format(d.value) + ') - ' + (total/d.value*100).toFixed(2) + '%'; })
          d3.select('.text.' + cleanStr(link.target.UIUD))
            .text(function(d) { return d.name + ' (' + format(val) + '/' + format(d.value) + ') - ' + (val/d.value*100).toFixed(2) + '%'; })
          d3.select('.text.' + cleanStr(d.source.UIUD))
            .text(function(d) { return d.name + ' (' + format(origin) + '/' + format(d.value) + ') - ' + (origin/d.value*100).toFixed(2) + '%'; })

          svg.append('path')
            .attr('class', function(d){
              return 'tempLink ' + getLinkIdentity(link.source.UIUD, target.link)
            })
            .attr('d', path(link))
            .style("stroke-width", Math.max(1, link.dy))
            .sort(function(a, b) { return b.dy - a.dy; })
            .style('stroke', 'teal')
            .style('fill', 'none')
            .style('stroke-opacity', .5)
        }
      })
    }
    linkage.colouring = (link) => {
      d3.select('.rect.' + cleanStr(link.source.name)).style('fill', 'maroon')
      d3.select('.rect.' + cleanStr(link.target.name)).style('fill', 'maroon')
      d3.select('.text.' + cleanStr(link.source.name)).attr('visibility', true).style('fill', 'black')
      d3.select('.text.' + cleanStr(link.target.name)).attr('visibility', true).style('fill', 'black')
    }

    linkage.drawLinks = (d) => {
      linkage.colouring(d)

      //Order of drawing is important -> things are being overridden
      linkage.drawSublinks(d)
      nodes.addSideNodes(d, 'target')
       _.forEach(d.target.sourceLinks, function(item) {
        linkage.drawSublinks(item)
      })

      //backwards
      linkage.drawSublinksBackwards(d)
      nodes.addSideNodes(d, 'source')
       _.forEach(d.source.targetLinks, function(item) {
        linkage.drawSublinksBackwards(item)
      })
    }
    linkage.getSankeyPath = (d) => {
      
      //looking for the connection via className -> rather loop intensive
      _.forEach(d.sourceLinks, function(d){ //forwards
        linkage.colouring(d)
        linkage.drawSublinks(d)
         _.forEach(d.target.sourceLinks, function(item) {
          linkage.drawSublinks(item)
        })
      })
      _.forEach(d.targetLinks, function(d){//backwards
        linkage.colouring(d)
        linkage.drawSublinksBackwards(d)
         _.forEach(d.source.targetLinks, function(item) {
          linkage.drawSublinksBackwards(item)
        })
      })

      d3.selectAll('.link').filter(function(l, i) {
        return isLinkRelated(d,l)
      }).style('stroke', 'orange').style('stroke-opacity', .5)
    }

    const nodes = {}
    nodes.addSideNodes = (d, type) => {
      var adjY = 0;
      if(type === 'source'){
        /*_.forEach(d.source.sourceLinks, function(item) {
          if(item.target.name === d.target.name)
            return false
          adjY += item.dy
        })*/
        adjY = _.find(d.source.sourceLinks, (item) => {
          return item.target.name === d.target.name
        }).sy
      }
      if(type === 'target'){
        /*_.forEach(d.target.targetLinks, function(item) {
          if(item.source.name === d.source.name){
            return false
          }
          adjY += item.dy
        })*/
        adjY = _.find(d.target.targetLinks, (item) => {
          return item.source.name === d.source.name
        }).ty
      }

      var widthOfSelected = 'temp_dy' in d ? d.temp_dy : d.dy

      svg.append('rect')
        .attr('pointer-events', 'none')
        .classed('tempSideNode', true)
        .attr('x', d[type].x)        
        .attr('y', d[type].y + adjY)
        .attr('height', widthOfSelected)
        .attr('width', sankey.nodeWidth())  
        .style('fill', 'pink')
        .style("stroke", 'black')
    }
    nodes.addSideNodes2 = (d) => {
      var targetRect = cleanStr(d.name)
      d3.selectAll('.rect').filter('.' + targetRect).style('fill', 'pink')

      var adjY = 0;
      _.forEach(d.sourceLinks, function(item) {
        nodes.addSideNodes(item, 'target')
      })
      _.forEach(d.targetLinks, function(item) {
        nodes.addSideNodes(item, 'source')
      })
    }

    // add the link titles
    link.append("title")
      .text(function(d) {
        var total = d.source.sourceLinks.reduce(function(agg, d) {
          return agg + parseFloat(d.value)
        }, 0)
        return d.source.name + " → " + 
          d.target.name + "\n" + 
          format(formatNumber(total)) + " → " + format(d.value); 
      });
   
    // add in the nodes
    var node = svg.append("g").selectAll(".node")
        .data(graph.nodes)
      .enter().append("g")
        .attr("class", function(d) {
          return 'node ' + cleanStr(d.name);
        })
        .attr("transform", function(d) { 
  		  return "translate(" + d.x + "," + d.y + ")"; })
      .call(d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", function() { 
  		    this.parentNode.appendChild(this); 
        })
        .on("drag", dragmove));
   
    function isLinkRelated(d, l){
      //Use to find adjacent links when hovering on a rect
      var t = l.source == d || l.target == d
      return t
    }
    
    node.append("rect")
        .attr('class', function(d) {
          return 'rect ' + cleanStr(d.name)
        })
        .attr("height", function(d) { return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("fill", rectColor)
        .style("stroke", function(d) { 
  		    return d3.rgb(rectColor).darker(2); 
        })
        //to show the path linkage on hover...
        .on('mouseover', function(d) { 
          console.log('d___d', d)

          //Moving links to top
          moveLinksToTop(_.map(d.sourceLinks, (link) => { return link.dy; }))
          moveLinksToTop(_.map(d.targetLinks, (link) => { return link.dy; }))
          
          d3.selectAll('.rect').style('fill', 'gray')
          d3.selectAll('.text').style('fill', 'white').attr('visibility', 'hidden')

          //links
          d3.selectAll('.link')
		        .style('stroke', 'gray')
		        .style('stroke-opacity', .1)
          linkage.getSankeyPath(d);

          nodes.addSideNodes2(d) //pink highlighting
        })

        .on('mouseout', function(d) {
          revertToOriginal()
        })
      .append("title")
        .text(function(d) { 
    		  return d.name + "\n" + format(d.value); 
        });

    // add in the title for the nodes
    node.append("text")
        .attr('class', function(d){
          return 'text ' + cleanStr(d.name);
        })
        .attr("x", -6)
        .attr("y", function(d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("pointer-events", "none")
        .attr("transform", null)
        .text(function(d) { return d.name; })
      .filter(function(d) { return d.x < width / 2; })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start")

    // the function for moving the nodes
    function dragmove(d) {
      d3.select(this).attr("transform", 
          "translate(" + (d.x
          	   //d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))
          	) + "," + (
              d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
            ) + ")");
      sankey.relayout();
      d3.selectAll('.link').attr("d", path);
    }

    function revertToOriginal(){ //transitions tend to interfer with new selection...
      d3.selectAll('.rect').style('fill', (d) => rectColor).style('stroke', 'white').style('stroke-width',1)
      d3.selectAll('.link').style('stroke', linkColor).style('stroke-opacity', .5)
      d3.selectAll('.text')
        .attr('visibility', (d) => d.value/self.props.sankey.meta[1] > .01 ? true : 'hidden' )
        .style('fill', 'black')
        .text(function(d) { return d.name + ' (' + format(d.value) + ')'; })
      d3.selectAll('.tempSideNode').style('fill', rectColor).remove()
      d3.selectAll('.tempLink').style('stroke', linkColor).style('stroke-opacity', .5).remove()
      _.forEach(d3.selectAll('.link')[0], function(link) {    
        delete link.__data__.temp_dy
      })
    }
	},

  render() {
    return (
      <div id='chart' ref="graph"></div>
    )
  },

  componentDidMount() {
    console.log('componentDidMount')
    $(window).on('resize', this.updateGraphSize);

    //Only render chart once has component has mounted so that div exists
    const width = $(this.refs.graph.getDOMNode()).width()
    this.destroyChart()
    this.createChart(width, this.props.height)
  },

  componentWillUnmount() {
    $(window).off('resize', this.updateGraphSize);
  },

  updateGraphSize() {
    console.log('updateGraphSize')
    var width = $(this.refs.graph.getDOMNode()).width();
    this.destroyChart()
    this.createChart(width, this.props.height)
  },

  componentDidUpdate() {
    console.log('componentDidUpdate')
    const width = $(this.refs.graph.getDOMNode()).width()
    this.destroyChart()
    this.createChart(width, this.props.height)
  }

});

module.exports = SankeyComponent;