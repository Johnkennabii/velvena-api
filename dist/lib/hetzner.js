import { S3Client } from "@aws-sdk/client-s3";
export const s3 = new S3Client({
    region: "eu-central-1",
    endpoint: "https://hel1.your-objectstorage.com",
    credentials: {
        accessKeyId: process.env.HETZNER_ACCESS_KEY,
        secretAccessKey: process.env.HETZNER_SECRET_KEY,
    },
});
export const hetznerBucket = process.env.HETZNER_BUCKET;
//# sourceMappingURL=hetzner.js.map