var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'eval',
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './src/index'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [{
      include: [
        /node_modules\/og_api/,
        /node_modules\/og_flux/,
        /node_modules\/og_analytics/,
        path.join(__dirname, 'src')
      ],
      loader: "babel?blacklist=useStrict",
      test: /\.jsx?$/,
      loaders: ['react-hot', 'babel']
    }]
  }
};
