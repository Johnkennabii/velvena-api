import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loadJson = (filename) => JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));
const getMailboxes = loadJson("./get-mailboxes.json");
const getMails = loadJson("./get-mails.json");
const getMailById = loadJson("./get-mail-by-id.json");
const deleteMail = loadJson("./delete-mail.json");
const deleteMailPermanent = loadJson("./delete-mail-permanent.json");
const markAsRead = loadJson("./mark-as-read.json");
const markAsUnread = loadJson("./mark-as-unread.json");
const sendMail = loadJson("./send-mail.json");
const addFlag = loadJson("./add-flag.json");
const removeFlag = loadJson("./remove-flag.json");
const moveEmail = loadJson("./move-email.json");
export default {
    ...getMailboxes,
    ...getMails,
    ...getMailById,
    ...deleteMail,
    ...deleteMailPermanent,
    ...markAsRead,
    ...markAsUnread,
    ...sendMail,
    ...addFlag,
    ...removeFlag,
    ...moveEmail,
};
//# sourceMappingURL=index.js.map