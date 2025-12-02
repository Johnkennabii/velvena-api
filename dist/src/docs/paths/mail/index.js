import getMailboxes from "./get-mailboxes.json" with { type: "json" };
import getMailFolders from "./get-mail-folders.json" with { type: "json" };
import getMails from "./get-mails.json" with { type: "json" };
import getMailById from "./get-mail-by-id.json" with { type: "json" };
import deleteMailPermanent from "./delete-mail-permanent.json" with { type: "json" };
import markAsRead from "./mark-as-read.json" with { type: "json" };
import markAsUnread from "./mark-as-unread.json" with { type: "json" };
import sendMail from "./send-mail.json" with { type: "json" };
import createMailFolder from "./create-mail-folder.json" with { type: "json" };
import moveMailFolder from "./move-mail-folder.json" with { type: "json" };
import addFlag from "./add-flag.json" with { type: "json" };
import removeFlag from "./remove-flag.json" with { type: "json" };
import moveEmail from "./move-email.json" with { type: "json" };
import downloadEmailAttachment from "./download-email-attachment.json" with { type: "json" };
export default {
    "/mails/folders": {
        ...getMailFolders["/mails/folders"],
        ...createMailFolder["/mails/folders"],
    },
    ...getMailboxes,
    ...getMails,
    ...getMailById,
    ...deleteMailPermanent,
    ...markAsRead,
    ...markAsUnread,
    ...sendMail,
    ...moveMailFolder,
    ...addFlag,
    ...removeFlag,
    ...moveEmail,
    ...downloadEmailAttachment,
};
//# sourceMappingURL=index.js.map