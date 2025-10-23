/**
 * @description Generates a unique id
 *  This function will generate a unique id using the current timestamp and a random number, both in base 36.
 *  id = timestamp + '-' + randomNumber
 *  The id is not guaranteed to be unique, but it is very unlikely to collide with another id.
 * @returns A unique id
 */
export default function generateId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).slice(2, 7);
    return `${timestamp}-${randomPart}`;
}
