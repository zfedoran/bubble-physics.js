const webpack               = require('webpack');
const path                  = require('path');
const buildPath             = path.resolve(__dirname, 'build');
const nodeModulesPath       = path.resolve(__dirname, 'node_modules');
const TransferWebpackPlugin = require('transfer-webpack-plugin');

const config = {
    //Entry points to the project
    entry: [
        'webpack/hot/dev-server',
        'webpack/hot/only-dev-server',
        path.join(__dirname, '/src/index.js')
    ],

    //Config options on how to interpret requires imports
    resolve: {
        extensions: ["", ".js"],
        //node_modules: ["web_modules", "node_modules"]    (Default Settings)
    },

    //Server Configuration options
    devServer:{
        contentBase: 'www',    //Relative directory for base of server
        devtool: 'eval',
        hot: true,                //Live-reload
        inline: true,
        port: 3000,                //Port Number
        host: 'localhost',    //Change to '0.0.0.0' for external facing server
    },

    devtool: 'source-map',

    output: {
        path: buildPath,        //Path of output file
        filename: 'main.js',
        library: ['BubblePhysics'],
        libraryTarget: 'var'
    },

    plugins: [
        //Enables Hot Modules Replacement
        new webpack.HotModuleReplacementPlugin(),
        //Allows error warnings but does not stop compiling. Will remove when eslint is added
        new webpack.NoErrorsPlugin(),
        //Moves files
        new TransferWebpackPlugin([
            {from: './'},
        ], path.resolve(__dirname, "www")),
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
