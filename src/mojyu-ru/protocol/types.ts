export enum MsgType {
    Join = "join",
        JoinAck = "join-ack",
        JoinNack = "join-nack",
        JoinBroadcast = "join-broadcast",
        Leave = "leave",
        LeaveBroadcast = "leave-broadcast",
        DH = "DH",
        Message = "message"
}

export type AnyMessage = {
    type: MsgType;
    room: string;
    name ? : string;
    reason ? : string;
    public_key ? : JsonWebKey;
    iv ? : string;
    data ? : string;
};