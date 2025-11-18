export const verifyAdminCode = (req, res, next) => {
    const adminCode = req.headers?.['x-admin-code'] || req.body?.adminCode;

    if (!adminCode) {
        return res.status(401).json({ error: 'Admin code required' });
    }

    if (adminCode !== process.env.SECRET_ADMIN_CODE) {
        return res.status(403).json({ error: 'Invalid admin code' });
    }

    next();
};
