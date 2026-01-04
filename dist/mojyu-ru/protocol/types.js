export var MsgType;
(function (MsgType) {
    MsgType["Join"] = "join";
    MsgType["JoinAck"] = "join-ack";
    MsgType["JoinNack"] = "join-nack";
    MsgType["JoinBroadcast"] = "join-broadcast";
    MsgType["Leave"] = "leave";
    MsgType["LeaveBroadcast"] = "leave-broadcast";
    MsgType["DH"] = "DH";
    MsgType["Message"] = "message";
})(MsgType || (MsgType = {}));
