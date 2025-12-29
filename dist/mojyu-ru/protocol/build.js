export function buildMessage(type, payload) {
    return {
        type,
        ...payload
    };
}
