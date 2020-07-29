import HtmlWebpackPlugin from 'html-webpack-plugin'
import * as webpack from 'webpack'
import * as path from 'path'

const config: webpack.Configuration = {
    entry: './example/index.tsx',
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
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './example/index.ejs',
            title: 'Mutoid',
        }),
        new webpack.SourceMapDevToolPlugin(),
        new webpack.DefinePlugin({
            ENV: JSON.stringify('dev'),
            APIKEY: JSON.stringify('xxx'),
            USERNAME: JSON.stringify(process.env.USERNAME),
        }),
    ],
}

export default config
