import babel from "rollup-plugin-babel"
import analyze from "rollup-plugin-analyzer"
import minify from "rollup-plugin-babel-minify"
import typescript from "rollup-plugin-typescript2"
import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"

export default {
	input: `./src/index.ts`,
	output: {
		file: `./dist/main.js`,
		format: "umd",
		sourcemap: true,
		name: "OmniCookies"
	},
	plugins: [
		typescript({
			tsconfig: "./tsconfig.json",
		}),
		resolve(),
		babel({
			exclude: "node_modules/**",
			sourceMaps: true,
		}),
		analyze({
			summaryOnly: true,
		}),
		minify({
			comments: false,
		}),
		commonjs(),
	],
}
