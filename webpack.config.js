const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (env, argv) => {
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
            filename: argv.mode === 'production' ? 'bundle.[hash].js' : 'bundle.js',
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
        ],
    }

    return config
}
