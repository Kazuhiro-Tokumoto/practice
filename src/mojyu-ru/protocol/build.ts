import {
    MsgType,
    AnyMessage
} from "./types.js";
import {
    allowedFields
} from "./allowed.js";

export type MessagePayload = Omit < AnyMessage, "type" > ;

export function buildMessage(
    type: MsgType,
    payload: MessagePayload
): AnyMessage {
    return {
        type,
        ...payload
    };
}