const path = require('path');

const server = {
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
};

const client = {
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
                test: [/node/, /\.\/node/],
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
        globalObject: 'this',
        path: path.resolve(__dirname, 'dist')
    }
};

module.exports = [client, server];
