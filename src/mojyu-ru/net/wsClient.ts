// wsClient.ts
function createWS(url: string) {
    const ws = new WebSocket(url);
    const handlers = new Set < (msg: any) => void > ();
    let isOpen = false;

    ws.onopen = () => {
        console.log("[ws] open");
        isOpen = true;
    };

    ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        for (const fn of handlers) fn(msg);
    };

    function send(obj: unknown) {
        if (!isOpen) {
            console.warn("[ws] send before open", obj);
            return;
        }
        ws.send(JSON.stringify(obj));
    }

    return {
        send,
        onMessage(fn: (msg: any) => void) {
            handlers.add(fn);
        },
        onOpen(fn: () => void) {
            if (isOpen) fn();
            else ws.addEventListener("open", fn, {
                once: true
            });
        }
    };
}

export {
    createWS
};