import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import * as webpack from 'webpack'
import * as path from 'path'

const config = (_: unknown, argv: { mode: string }) => ({
    entry: './example/index.tsx',
    devtool: argv.mode === 'production' ? 'source-map' : 'inline-source-map',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
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
