const DB = "lv-bao-er-editor";
export async function storeRead() {
  return transact("readonly", (s) => s.get("draft"));
}
export async function storeWrite(value) {
  return transact("readwrite", (s) => s.put(value, "draft"));
}
function transact(mode, work) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore("content");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction("content", mode);
      const request = work(tx.objectStore("content"));
      tx.oncomplete = () => {
        resolve(request.result);
        db.close();
      };
      tx.onerror = () => {
        reject(tx.error);
        db.close();
      };
      tx.onabort = () => {
        reject(tx.error || new Error("本地存储已取消"));
        db.close();
      };
    };
  });
}
