export function dhs(a: any, mykey: any, salt: any, name: string, room: string) {
    // a.data が存在するかチェック（安全のため）
    const msgData = typeof a.data === "string" ? JSON.parse(a.data) : a;

    if (msgData.type === "dh-start" || msgData.type === "join-broadcast") {
        // 文字列にせず、オブジェクトとして返す
        return {
            type: "DH",
            name: name,
            room: room,
            salt: salt,
            public_key: mykey
        };
    }
    return null;
}