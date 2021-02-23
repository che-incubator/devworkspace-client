const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

var server = {
    entry: './src/index.ts',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },
    node: {
        __dirname: false
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    target: 'node',
    output: {
        filename: 'server.js',
        library: 'devworkspace-client',
        libraryTarget: 'umd',
        globalObject: 'this',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new CopyPlugin({
            patterns: [
              { 
                  from: 'specs/*.json.gz',
                  to: path.resolve(__dirname, 'dist'),
                  context: path.resolve('node_modules', 'openshift-rest-client', 'lib')
              },
            ],
        }),
    ]
};

var client = {
    entry: './src/index.ts',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /node/,
                loader: 'null-loader',
            },
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'client.js',
        library: 'devworkspace-client',
        libraryTarget: 'umd',
        path: path.resolve(__dirname, 'dist')
    }
};

module.exports = [client, server];
