const positions = new Map();
export const rememberScroll = (key) => positions.set(key, window.scrollY);
export const savedScroll = (key) => positions.get(key) || 0;
