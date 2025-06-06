/* eslint-disable */
export function throttle(func: any, wait: number) {
    let timeout: any; let previous = 0;
    return function (this: any, ...args: any[]) {
        const now = Date.now();
        const remaining = wait - (now - previous);
        clearTimeout(timeout);
        if (remaining <= 0) { previous = now; func.apply(this, args); }
        else { timeout = setTimeout(() => { previous = Date.now(); func.apply(this, args);}, remaining); }
    };
}