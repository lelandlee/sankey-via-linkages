import React, { Component } from 'react';

const SankeyComponent = require('./sankey_component')
const data = require('./json_with_col') //callback issue...
const og_api = require('og_api')

export default class App extends Component {
  render() {

  	console.log(data, og_api)

    return (
    	<div>
	      <h1>Hello, world Now Or Never</h1>
	      <SankeyComponent
	      	data={data}
	      	height={window.innerHeight}
	      	width={window.innerWidth}/>
	    </div>
    );
  }
}
