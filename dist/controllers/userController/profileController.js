import prisma from "../../lib/prisma.js";
export const getProfiles = async (_req, res) => {
    const profiles = await prisma.profile.findMany();
    res.json(profiles);
};
export const createProfile = async (req, res) => {
    try {
        const profile = await prisma.profile.create({
            data: req.body,
        });
        res.status(201).json(profile);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
//# sourceMappingURL=profileController.js.map