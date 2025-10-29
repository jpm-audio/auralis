/**
 * Utility function to wait for a specified time.
 * @param time Time in milliseconds to wait.
 * @returns	 Promise that resolves after the specified time.
 */
export async function wait(time: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, time));
}