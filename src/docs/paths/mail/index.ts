import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadJson = (filename: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));

const docs = [
  loadJson("./get-mailboxes.json"),
  loadJson("./get-mail-folders.json"),
  loadJson("./get-mails.json"),
  loadJson("./get-mail-by-id.json"),
  loadJson("./delete-mail-permanent.json"),
  loadJson("./mark-as-read.json"),
  loadJson("./mark-as-unread.json"),
  loadJson("./send-mail.json"),
  loadJson("./create-mail-folder.json"),
  loadJson("./add-flag.json"),
  loadJson("./remove-flag.json"),
  loadJson("./move-email.json"),
  loadJson("./download-email-attachment.json"),
];

export default docs.reduce<Record<string, any>>((acc, doc) => {
  for (const [pathKey, pathValue] of Object.entries(doc)) {
    acc[pathKey] = { ...(acc[pathKey] || {}), ...(pathValue as object) };
  }
  return acc;
}, {});
