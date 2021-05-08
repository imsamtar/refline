const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MonacoEditorWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');
const sveltePreprocess = require('svelte-preprocess');

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

module.exports = {
	entry: {
		[prod ? 'bundle' : 'build/bundle']: ['./src/main.ts']
	},
	resolve: {
		alias: {
			svelte: path.dirname(require.resolve('svelte/package.json')),
			$ui: path.resolve(__dirname, 'src/ui'),
			$stores: path.resolve(__dirname, 'src/stores'),
			$utils: path.resolve(__dirname, 'src/utils'),
		},
		extensions: ['.mjs', '.js', '.ts', '.svelte'],
		mainFields: ['svelte', 'browser', 'module', 'main']
	},
	output: {
		path: path.join(__dirname, prod ? '/public/build' : '/public'),
		filename: '[name].js',
		chunkFilename: '[name].[id].js',
		...(prod ? {
			publicPath: '/build/'
		} : {})
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				loader: 'ts-loader',
				exclude: /node_modules/
			},
			{
				test: /\.svelte$/,
				use: {
					loader: 'svelte-loader',
					options: {
						compilerOptions: {
							dev: !prod
						},
						emitCss: prod,
						hotReload: !prod,
						preprocess: sveltePreprocess({ sourceMap: !prod })
					}
				}
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader'
				]
			},
			{
				// required to prevent errors from Svelte on Webpack 5+
				test: /node_modules\/svelte\/.*\.mjs$/,
				resolve: {
					fullySpecified: false
				}
			},
			{
				test: /\.ttf$/,
				use: ['file-loader']
			}
		]
	},
	mode,
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].css'
		}),
		new MonacoEditorWebpackPlugin({
			filename: '[name].worker.js',
			languages: ['html', 'css', 'typescript', 'graphql']
		})
	],
	devtool: prod ? false : 'source-map',
	devServer: {
		hot: true
	}
};
