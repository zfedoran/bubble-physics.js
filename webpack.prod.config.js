const webpack               = require('webpack');
const path                  = require('path');
const buildPath             = path.resolve(__dirname, 'build');
const nodeModulesPath       = path.resolve(__dirname, 'node_modules');
const TransferWebpackPlugin = require('transfer-webpack-plugin');

const config = {
    //Entry points to the project
    entry: [
        path.join(__dirname, '/src/index.js')
    ],

    //Config options on how to interpret requires imports
    resolve: {
        extensions: ["", ".js"],
        //node_modules: ["web_modules", "node_modules"]    (Default Settings)
    },

    output: {
        path: buildPath,        //Path of output file
        filename: 'main.js',
        library: ['BubblePhysics'],
        libraryTarget: 'var'
    },

    plugins: [
        // Minify the bundle
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                // supresses warnings, usually from module minification
                warnings: false,
            },
        }),
        // Allows error warnings but does not stop compiling.
        new webpack.NoErrorsPlugin(),
        // Transfer Files
        new TransferWebpackPlugin([
            {from: 'www'},
        ], path.resolve(__dirname, 'src')),
    ],

    module: {
        loaders: [
            {
                //React-hot loader and
                test: /\.js$/,    //All .js files
                loaders: ['babel-loader'], //react-hot is like browser sync and babel loads jsx and es6-7
                exclude: [nodeModulesPath],
            },
        ],
    },

    //eslint config options. Part of the eslint-loader package
    eslint: {
        configFile: '.eslintrc',
    },
};

module.exports = config;
