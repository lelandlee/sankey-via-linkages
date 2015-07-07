'use strict'
/* To do

 * When move to main code -> use props model to save the states????
 * Make functions -> get next node, etc

 * Have link highlighting go left, rather than just backwards
 * Fix rect highlighting
 * Impliment recusive code for linkages

 * Create a rerender function...

 * HOW TO HIT API:
 * Use res.pkg -> to find the names of all the nodes that want to view
 * hit another api.... to find linkages + values

 * Add side nodes via linkage location
*/


const React = require('react/addons');
const d3 = require('d3')
require('./sankey')
const _ = require('lodash')
const api = require('og_api')
var $ = require('jquery');


var SankeyComponent = React.createClass({
	propTypes: {
		data: React.PropTypes.object.isRequired,
		height: React.PropTypes.number.isRequired,
		width: React.PropTypes.number.isRequired
	},

	processData() {
		const graph = _.clone(this.props.data, true);
		const nodeMap = {};
	  graph.nodes.forEach(function(x) { 
	    nodeMap[x.name] = x;
	  });
	  graph.links = graph.links.map(function(x) {
	    return {
	      source: nodeMap[x.source],
	      target: nodeMap[x.target],
	      value: x.value
	    };
	  });

	  return graph
	},

  getDataViaAPI(){
    //Need to redirect endpoint
    
    const data_sets = ["B05A202E6E5F474190E5314AD62775C7"];
    const coa_id = '9E9AC6B664934C0DB3F2E433F502316D';
    const coa_mask_id = null;
    var mask;
    const params = {
      coa_mask_id,
      data_sets,
      mask,
    };
    var req = api.tapi.post('package', coa_id, params);
    console.log('package', coa_id, params)
    req.end()
      .then((res) => {
        var pkg = res.body;
        console.log('pkg', pkg)
        if (!_.size(pkg.data_sets)) {
          //SummaryReportActions.loadedPackageNoDataSets(pkg);
        }
        //SummaryReportActions.getPackageSuccess(pkg);
      }).catch((err) => {
        throw err;
      });
  },

	//ought to have render + updateChart methods
  destroyChart() {
    d3.selectAll('svg').remove();
  },
	createChart(w, h) {
		const units = "unit";

		const self = this

    //var $graph = $(this.refs.graph.getDOMNode())
    //var h = $(window).height() - $graph.offset().top;
     
    const margin = {top: 20, right: 20, bottom: 20, left: 20}
    const width = w - margin.left - margin.right
    const height = h - margin.top - margin.bottom
     
    const formatNumber = function(d){return d}
    const format = function(d) { return formatNumber(d) + " " + units; }
    const cleanStr = function(str){
      return str.replace(/ /g,'').replace(/\W/g, '').toLowerCase()
    }

    const linkColor = '#cbe3f3';
    const rectColor = '#102b3f';
     
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
     
    var graph = this.processData()

    // Set the sankey diagram properties
    var sankey = d3.sankey()
      .nodeWidth(10)
      .nodePadding(10)
      .size([width, height])
      .nodes(graph.nodes) //Where the rects are located
      .links(graph.links) //Thing that connects the nodes together
      .layout(32);
    var path = sankey.link(); 

    //reverse is for when going backwards in terms of linkages...
    const getLinkIdentity = (name1, name2, reverse) => {
      if(reverse)
        return cleanStr(name2) + '_' + cleanStr(name1);
      return cleanStr(name1) + '_' + cleanStr(name2);
    }
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
        if (a.dy != d.dy) return -1;
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
      .sort(function(a, b) { return b.dy - a.dy; })
      .on('mouseover', function(d){ //Currently works going right, not left
        console.log('link', d)

        moveLinksToTop(d)

        //node.addSideNodes(d, 'source')
        //node.addSideNodes2(d.target)

        d3.selectAll('.rect').style('fill', 'gray')
        d3.selectAll('.link')
          .style('stroke', 'gray')
          .style('stroke-opacity', .1)

        //var colOrigin = d.source.col/2 + d.target.col/2
        d3.select(this).style('stroke', 'cadetblue').style('stroke-opacity', .5)

        linkage.drawLinks(d)
        
      })
      .on('mouseout', function(d){
        revertToOriginal()
      })

    const linkage = {}
    linkage.drawSublinksBackwards = (d) => {
      //Only if > 1 input for the node || node has no outputs
      //if(d.source.sourceLinks.length !== 1 && d.source.targetLinks.length !== 0){
        console.log('backwards', d)

        var totalInputWidth = d.source.dy
        var widthOfSelected = 'temp_dy' in d ? d.temp_dy : d.dy
        console.log('temp_dy' in d, d.temp_dy, d.dy)

        _.forEach(d.source.targetLinks, function(linkNotClone) { //draws each link
          link = _.clone(linkNotClone, true)

          var offset = 0
          _.forEach(link.target.sourceLinks, function(selectLinkCol) {
            if(d.target.name == selectLinkCol.target.name){
              return false
            }
            offset += selectLinkCol.dy
          }, 0)
          
          link.source.y = link.source.y + link.dy * offset/totalInputWidth
          link.target.y = link.target.y + link.dy * offset/totalInputWidth
          link.dy = link.dy * widthOfSelected/totalInputWidth

          //link.source.y = 'temp_source_dy' in d ? d.temp_source_dy : link.source.y + link.dy * offset/totalInputWidth
          //link.target.y = 'temp_target_dy' in d ? d.temp_target_dy : link.target.y + link.dy * offset/totalInputWidth
          //link.dy = 'temp_dy' in d ? d.temp_dy : link.dy * widthOfSelected/totalInputWidth


          linkNotClone.temp_dy = link.dy
          linkNotClone.temp_source_dy = link.source.y
          linkNotClone.temp_target_dy = link.target.y


          d3.select('.' + getLinkIdentity(link.target.name, link.source.name, true))
            .style('stroke', 'gray')
            .style('stroke-opacity', .1)

          d3.select('.rect.' + cleanStr(link.source.name)).style('fill', 'maroon')
          d3.select('.rect.' + cleanStr(link.target.name)).style('fill', 'maroon')

          svg.append('path')
            .attr('class', function(d){
              return 'tempLink ' + getLinkIdentity(link.target.name, link.source.name, true)
            })
            .attr('d', path(link))
            .style("stroke-width", Math.max(1, link.dy))
            .sort(function(a, b) { return b.dy - a.dy; })
            .style('stroke', 'black')
        })
      //}
    }
    linkage.drawSublinks = (d) => {
      //Only if > 1 input for the node || node has no outputs
      //if(d.target.targetLinks.length !== 1 && d.target.sourceLinks.length !== 0){
        var totalInputWidth = d.target.dy
        var widthOfSelected = 'temp_dy' in d ? d.temp_dy : d.dy

        _.forEach(d.target.sourceLinks, function(linkNotClone) {
          link = _.clone(linkNotClone, true)

          var offset = 0
          _.forEach(link.source.targetLinks, function(selectLinkCol) {
            if(d.source.name == selectLinkCol.source.name){
              return false
            }
            offset += selectLinkCol.dy
          }, 0)
          
          link.target.y += link.dy * offset/totalInputWidth
          link.source.y += link.dy * offset/totalInputWidth
          link.dy *= widthOfSelected/totalInputWidth

          linkNotClone.temp_dy = link.dy

          d3.select('.' + getLinkIdentity(link.source.name, link.target.name))
            .style('stroke', 'gray')
            .style('stroke-opacity', .1)

          d3.select('.rect.' + cleanStr(link.source.name)).style('fill', 'maroon')
          d3.select('.rect.' + cleanStr(link.target.name)).style('fill', 'maroon')

          svg.append('path')
            .attr('class', function(d){
              return 'tempLink ' + getLinkIdentity(link.source.name, link.target.name)
            })
            .attr('d', path(link))
            .style("stroke-width", Math.max(1, link.dy))
            .sort(function(a, b) { return b.dy - a.dy; })
            .style('stroke', 'black')
        })
      //}
    }
    linkage.drawLinks = (d) => {
      d3.select('.rect.' + cleanStr(d.source.name)).style('fill', 'maroon')
      d3.select('.rect.' + cleanStr(d.target.name)).style('fill', 'maroon')

      //Order of drawing is important -> things are being overridden
      //out to do this recursively...dig as deep as necessary
      linkage.drawSublinks(d)
       _.forEach(d.target.sourceLinks, function(item) {
        linkage.drawSublinks(item)
      })

      //backwards
      linkage.drawSublinksBackwards(d)
       _.forEach(d.source.targetLinks, function(item) {
        linkage.drawSublinksBackwards(item)
      })
    }

    const nodes = {}
    nodes.addSideNodes = (d, type) => {
      var x = d[type].x
      var y = d[type].y

      var adjY = 0;
      if(type === 'source'){
        _.forEach(d.source.sourceLinks, function(item) {
          if(item.target.name === d.target.name)
            return false
          adjY += item.dy
        })
      }
      if(type === 'target'){
        _.forEach(d.target.targetLinks, function(item) {
          if(item.source.name === d.source.name)
            return false
          adjY += item.dy
        })
      }

      svg.append('rect')
        .attr('pointer-events', 'none')
        .classed('tempSideNode', true)
        .attr('x', x)        
        .attr('y', y + adjY)
        .attr('height', d.dy)
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
    function getSankeyPath(d){
      
      //looking for the connection via className -> rather loop intensive
      _.forEach(d.sourceLinks, function(d){
        linkage.drawLinks(d) //forwards
      })
      _.forEach(d.targetLinks, function(d){
        linkage.drawLinks(d) //backwards
      })

      d3.selectAll('.link').filter(function(l, i) {
        return isLinkRelated(d,l)
      }).style('stroke', 'orange').style('stroke-opacity', .5)
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
          _.forEach(d.sourceLinks, function(link){
            moveLinksToTop(link);
          })
          _.forEach(d.targetLinks, function(link){
            moveLinksToTop(link);
          })
          
          d3.selectAll('.rect').style('fill', 'gray')

          //links
          d3.selectAll('.link')
		        .style('stroke', 'gray')
		        .style('stroke-opacity', .1)
          getSankeyPath(d);

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
    function revertToOriginal(){
      d3.selectAll('.rect').style('fill', rectColor)
      d3.selectAll('.link').style('stroke', linkColor).style('stroke-opacity', .5)
      d3.selectAll('.text').attr('fill', 'black')
      d3.selectAll('.tempSideNode').remove()
      d3.selectAll('.tempLink').remove()
      _.forEach(d3.selectAll('.link')[0], function(link) {    
        delete link.__data__.temp_dy
        delete link.__data__.temp_source_dy
        delete link.__data__.temp_target_dy
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
    console.log($(this.refs.graph.getDOMNode()).width());
    const width = $(this.refs.graph.getDOMNode()).width()
		this.createChart(width, this.props.height)

    console.log($(this.refs.graph.getDOMNode()));

	},

  componentWillUnmount() {
    $(window).off('resize', this.updateGraphSize);
  },

  updateGraphSize() {
    console.log('updateGraphSize')
    var width = $(this.refs.graph.getDOMNode()).width();
    console.log(width)
    this.destroyChart()
    this.createChart(width, this.props.height)
  },

	componentDidUpdate() {
		console.log('componentDidUpdate')
    var $graph = $(this.refs.graph.getDOMNode());

    var width = $graph.width();
    var top = $graph.offset().top;
    var windowHeight = $(window).height();
    var height = windowHeight - top;

    console.log('$graph', $graph)
	}

});

module.exports = SankeyComponent;