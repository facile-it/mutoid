/* eslint-disable @typescript-eslint/no-var-requires */
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const path = require('path')

module.exports = () => {
    const config = {
        entry: './example/index.tsx',
        devtool: false,
        resolve: {
            extensions: ['.ts', '.tsx', '.js'],
        },
        devServer: {
            contentBase: path.join(__dirname, 'dist'),
            compress: true,
            port: 9000,
        },
        output: {
            path: path.join(__dirname, '/dist'),
            filename: 'bundle.js',
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './example/index.html',
            }),
            new webpack.SourceMapDevToolPlugin(),
            new webpack.DefinePlugin({
                ENV: JSON.stringify('dev'),
                APIKEY: JSON.stringify('xxx'),
                USERNAME: JSON.stringify(process.env.USERNAME),
            }),
        ],
    }

    return config
}
