import React, { Component } from 'react';

const SankeyComponent = require('./sankey_component')
const data = require('./data_with_col')
//const data = require('./data_ga')
//const data = require('./data_circular')

export default class App extends Component {
  render() {

    return (
    	<div>
	      <h1>Hello, world Now Or Never</h1>
	      <div ref='graph'>
		      <SankeyComponent
		      	data={data}
		      	height={window.innerHeight * .75}
		      	width={window.innerWidth}/>
		    </div>
	    </div>
    );
  }
}
