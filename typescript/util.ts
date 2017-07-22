
/**Write zero into any array-like object.*/
export function erase(array):any {
	for (let i = 0; i < array.length; i++)
		array[i] = 0;
}
