import { Router } from "express";
import { getMailsFromMailbox, getMailById, deleteMail, permanentlyDeleteMail, markMailAsRead, markMailAsUnread, listMailboxes, sendMail, addMailFlag, removeMailFlag, moveMailToFolder, } from "../controllers/mailController/mailController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = Router();
// Liste des boîtes mail disponibles
router.get("/mailboxes", authMiddleware, listMailboxes);
// Récupère les emails d'une boîte mail spécifique
// Exemple: GET /mails/inbox?limit=50&offset=0
router.get("/:mailbox", authMiddleware, getMailsFromMailbox);
// Récupère un email spécifique par UID (avec HTML et texte complet)
// Exemple: GET /mails/inbox/123
router.get("/:mailbox/:uid", authMiddleware, getMailById);
// Supprime un email (le déplace vers la corbeille)
// Exemple: DELETE /mails/inbox/123
router.delete("/:mailbox/:uid", authMiddleware, deleteMail);
// Supprime définitivement un email
// Exemple: DELETE /mails/trash/123/permanent
router.delete("/:mailbox/:uid/permanent", authMiddleware, permanentlyDeleteMail);
// Marque un email comme lu
// Exemple: PATCH /mails/inbox/123/read
router.patch("/:mailbox/:uid/read", authMiddleware, markMailAsRead);
// Marque un email comme non lu
// Exemple: PATCH /mails/inbox/123/unread
router.patch("/:mailbox/:uid/unread", authMiddleware, markMailAsUnread);
// Ajoute un flag à un email (ex: \Flagged pour important)
// Exemple: PATCH /mails/inbox/123/flag/add
// Body: { flag: "\\Flagged" }
router.patch("/:mailbox/:uid/flag/add", authMiddleware, addMailFlag);
// Retire un flag d'un email
// Exemple: PATCH /mails/inbox/123/flag/remove
// Body: { flag: "\\Flagged" }
router.patch("/:mailbox/:uid/flag/remove", authMiddleware, removeMailFlag);
// Déplace un email d'un dossier à un autre
// Exemple: PATCH /mails/inbox/123/move
// Body: { toMailbox: "spam" }
router.patch("/:mailbox/:uid/move", authMiddleware, moveMailToFolder);
// Envoie un email
// Exemple: POST /mails/send
// Body: { to: "user@example.com", subject: "Hello", html: "<p>Hello</p>", text: "Hello" }
router.post("/send", authMiddleware, sendMail);
export default router;
//# sourceMappingURL=mailRoutes.js.map