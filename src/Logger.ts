import { name } from "./Vars"

export function log(message: any) {
	console.log(`[${name}] ${message}`)
}
export function warn(message: any) {
	console.warn(`[${name}] ${message}`)
}
export function error(message: any) {
	console.error(`[${name}] ${message}`)
}