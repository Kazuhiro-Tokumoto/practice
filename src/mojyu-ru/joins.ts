export function dhs(a: any, name: string, room: string,uuid:string,rand:Uint8Array): any {
    // a.data が存在するかチェック（安全のため）
    const msgData = typeof a.data === "string" ? JSON.parse(a.data) : a;

    if (msgData.type === "dh-start" || msgData.type === "join-broadcast") {
        // 文字列にせず、オブジェクトとして返す
        return {
            type: "DH",
            uuid: uuid,
            name: name,
            room: room,
            rand: rand,
        };
    }
    return null;
}