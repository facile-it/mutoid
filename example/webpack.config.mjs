import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import webpack from 'webpack'
import path from 'path'

const config = (_, argv) => ({
    entry: './example/index.tsx',
    devtool: argv.mode === 'production' ? 'source-map' : 'inline-source-map',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    devServer: {
        compress: true,
        port: 9000,
    },
    output: {
        path: path.join(new URL('.', import.meta.url).pathname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './example/index.ejs',
            title: 'Mutoid',
        }),
        new ForkTsCheckerWebpackPlugin(),
        new webpack.DefinePlugin({
            ENV: JSON.stringify('dev'),
            APIKEY: JSON.stringify('xxx'),
            USERNAME: JSON.stringify(process.env.USERNAME),
        }),
    ],
})

export default config
