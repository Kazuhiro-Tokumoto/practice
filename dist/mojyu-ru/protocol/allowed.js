import { MsgType } from "./types.js";
export const allowedFields = {
    [MsgType.Join]: ["type", "room", "name"],
    [MsgType.JoinAck]: ["type", "room"],
    [MsgType.JoinNack]: ["type", "room", "reason"],
    [MsgType.JoinBroadcast]: ["type", "room", "name"],
    [MsgType.Leave]: ["type", "room", "name"],
    [MsgType.LeaveBroadcast]: ["type", "room", "name"],
    [MsgType.DH]: ["type", "room", "name", "public_key"],
    [MsgType.Message]: ["type", "room", "iv", "data"]
};
