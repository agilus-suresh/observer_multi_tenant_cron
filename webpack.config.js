const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");



module.exports = {
    entry: './DNAC.js',
    output: {
      filename: './bundle.js',
      path: path.resolve(__dirname, 'public'),
    },
    target: 'node',
    resolve: {
        extensions: ['.tsx', '.ts', '.js','.json']
      },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude:['/node_modules/'],                      
                use: 'babel-loader'               
            }
        ]
  },
  node: {
    __dirname: false
  },
    plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "observer_time.txt")
        },
        {
          from: path.resolve(__dirname, "observer_node_url.txt")
        }
      ],
    }),
  ],
  };