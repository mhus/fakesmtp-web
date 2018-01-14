const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const BUILD_DIR = path.resolve('../resources/static/ui');
const INDEX_HTML_PATH = path.resolve('../resources/templates/index.html');

const ApiSettings = {
    devApi: 'http://localhost:8080',

    /* 
     * Docker host port must be hardcoded to 60500 (a random port I chose). eg ports: 60500:8080
     * Since the webpack injects this api url upon building, once theyre set theyre set. 
     * So if you use 'docker run' supplying different host port mappings, the ui wont connect to the rest api anymore.
     */
    productionApi: process.env.FAKE_SMTP_WEB_API || 'http://localhost:60500'
}

module.exports = function (env) {
    // production build link tags in index.html need to resolve to BUILD_DIR  
    const publicPath = (env === 'prod') ? '/ui/' : '/';

    const config = {
        entry: {
            app: ['./src/index.js']
        },
        output: {
            filename: 'bundle.js',
            publicPath: publicPath,
            path: BUILD_DIR
        },
        module: {
            rules: [
                {
                    test: /\.elm$/,
                    exclude: [/elm-stuff/, /node_modules/],
                    use: {
                        loader: 'elm-webpack-loader',
                    }
                },
                {
                    test: /\.css$/,
                    use: ExtractTextPlugin.extract({
                        fallback: 'style-loader',
                        use: 'css-loader',
                    })
                },
                {
                    test: /\.html$/,
                    use: 'html-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                    use: {
                        loader: 'file-loader',
                        options: {
                            limit: 10000,
                            outputPath: 'img/',
                            publicPath: publicPath,
                            name: 'img-[hash:6].[name].[ext]',
                        },
                    },
                }
            ],
            noParse: [/.elm$/]
        },
        plugins: [
            new CleanWebpackPlugin([BUILD_DIR, INDEX_HTML_PATH], {
                root: path.resolve(__dirname, '..'),
                verbose: true,
            }),
            new webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery'
            }),
            new ExtractTextPlugin('styles.css'),
            new HtmlWebpackPlugin({
                filename: INDEX_HTML_PATH,
                template: path.resolve(__dirname, 'src', 'index.html'),
                inject: 'body',
            }),
            new webpack.DefinePlugin({
                API_URL: (env === 'prod') ? JSON.stringify(ApiSettings.productionApi) : JSON.stringify(ApiSettings.devApi)
            })
        ],
        devServer: {
            port: 9000
        },
    }

    if (env === 'prod') {
        // production index.html goes into spring boot templates folder.
        config.plugins.push(new HtmlWebpackPlugin({
            filename: INDEX_HTML_PATH,
            template: path.resolve(__dirname, 'src', 'index.html'),
            inject: 'body',
        }));
    } else {
        // webpack dev server
        config.plugins.push(new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'src', 'index.html'),
            inject: 'body',
        }));
    }

        return config;
    };
    
