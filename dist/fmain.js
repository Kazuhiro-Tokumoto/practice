import { checkUserOnline } from './onlineoroffline.js';
const inputname = document.createElement("input");
const btncheck = document.createElement("button");
inputname.placeholder = "確認したい相手のUUIDを入力...";
btncheck.textContent = "オンライン確認";
document.body.appendChild(inputname);
document.body.appendChild(btncheck);
btncheck.addEventListener("click", async () => {
    const targetUuid = inputname.value;
    if (targetUuid) {
        const isOnline = await checkUserOnline(targetUuid);
        alert(`${targetUuid} さんは ${isOnline ? "オンライン" : "オフライン"} です。`);
    }
    else {
        alert("UUIDを入力してください。");
    }
});
