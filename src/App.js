/*
Note to self: might have to do with year 
-> because graph is scoped to a year…when clicking on that…(switches to 2014)

Control Sankey via the filterpanel...?



*/

import React, { Component } from 'react';

const SankeyComponent = require('./sankey_component')
const data = require('./data/linkage_data')
const _ = require('lodash')

export default class App extends Component {
  render() {
  	const sankey = this.processData()

    return (
    	<div>
	      <h1>Hello, world Now Or Never</h1>
	      <div ref='graph'>
		      <SankeyComponent
		      	sankey={sankey}
		      	height={window.innerHeight * .75}
		      	width={window.innerWidth}/>
		    </div>
	    </div>
    );
  }

  processData() {
    var data_set = '117e13b9-c0f9-4844-8d34-e68730b6298e'
    const linkages = data[data_set]

    var sankeyStructure = {"links": [], "nodes": []}

    _.forEach(linkages, (value, linkage) => {
      if(_.includes(linkage, 'undefined')) //Why so many undefined...But only when switching types, if load with revenues no issues...
        delete linkages[linkage] 
    })

    _.forEach(linkages, (value, linkage) => {
      const links = linkage.split('_') //because in link_link_link data arrangement
      const start = links[0]

      var prevLink = start;

      _.forEach(links, (link, index) => {
        const name = link
        sankeyStructure['nodes'].push({ 
          UIUD: link,
          name
        })

        if(link !== start){
          sankeyStructure["links"].push({
            source: prevLink,
            target: link,
            value: value, //Need to abs?
            col: index
          })
          prevLink = link
        }
      })
    })
    sankeyStructure['nodes'] = _.uniq(sankeyStructure['nodes'], function(node) {return node.UIUD})

    var tempLinkage = {}
    _.forEach(_.clone(sankeyStructure['links'], true), (link) => {

      var isIn = _.find(tempLinkage, (item, source) => {
        return item.source === link.source && item.target === link.target
      })

      if(typeof(isIn) !== 'undefined'){ //if array already contains item
        tempLinkage[link.source + link.target].value += link.value
      }
      else{
        tempLinkage[link.source + link.target] = ({
          source: link.source,
          target: link.target, 
          value: link.value,
          col: link.col
        })
      }
    })
    var origLen = sankeyStructure['links'].length

    var colTotals = {}
    sankeyStructure['links'] = _.map(tempLinkage, (item, source) => {
      if(item.col in colTotals) {
        colTotals[item.col] += item.value
      }
      if(!(item.col in colTotals)) {
        colTotals[item.col] = item.value
      }
      return {
        source: item.source, 
        target: item.target,
        value: item.value
      }
    })
		return {
	    data: sankeyStructure,
	    currentDataSet: data_set,
	    linkages: linkages,
	    meta: colTotals
	  }
	}
}
