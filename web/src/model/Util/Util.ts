// declare all characters
const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateRandomString(length: number) {
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

export function stringToUint8Array(str: string) {
    const arr = new Uint8Array(str.length);
    // Do NOT use a TextEncoder here, as this is node only (not browser)
    for (let i = 0; i < str.length; i++) {
        arr[i] = str.charCodeAt(i);
    }

    return arr;
}

/**
 * Given a HTML element, this will find the index of the element within its parent's children array.
 *
 * @param child The element to get the index of.
 * @returns The index of the element within its parent's children array.
 */
export function getChildNodeIndex(child: Element | null)
{
    var i = 0;
    while ((child = child!.previousElementSibling) != null )
    i++;

    return i;
}

export function findFirstNodeInDom(node1: Node, node2: Node) {
  return node1.compareDocumentPosition(node2)
    & Node.DOCUMENT_POSITION_FOLLOWING ? node1 : node2;
}

/**
 * Call this to detect if browser is running on Windows. Could break
 * in the future or not work in all cases.
 *
 * @returns True if the current OS is Windows, false otherwise.
 */
export function isRunningOnWindows() {
  // This might break in the future or not work in all cases...browsers
  // don't make it easy to detect OS
  return navigator.userAgent.includes('Win');
}
