import multer from 'multer';
import { supabase, BUCKET_NAME } from '../config/supabase.js';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

export const uploadMiddleware = upload.fields([
    { name: 'mapImage', maxCount: 1 },
    { name: 'characterImages', maxCount: 10 }
]);

export const uploadMap = async (req, res) => {
    try {
        // Check admin code first
        const adminCode = req.body?.adminCode;
        if (!adminCode) {
            return res.status(401).json({ error: 'Admin code required' });
        }
        if (adminCode !== process.env.SECRET_ADMIN_CODE) {
            return res.status(403).json({ error: 'Invalid admin code' });
        }

        const { mapName, characters } = req.body;
        const files = req.files;

        if (!files || !files.mapImage || !files.mapImage[0]) {
            return res.status(400).json({ error: 'Map image is required' });
        }

        const mapImageFile = files.mapImage[0];
        const characterImageFiles = files.characterImages || [];

        if (!mapName) {
            return res.status(400).json({ error: 'Map name is required' });
        }

        if (!characters) {
            return res.status(400).json({ error: 'Characters data is required' });
        }

        // Parse characters if it's a string
        let parsedCharacters;
        try {
            parsedCharacters = typeof characters === 'string' ? JSON.parse(characters) : characters;
        } catch (error) {
            return res.status(400).json({ error: 'Invalid characters data format' });
        }

        // Validate characters format
        if (!Array.isArray(parsedCharacters) || parsedCharacters.length === 0) {
            return res.status(400).json({ error: 'Characters must be a non-empty array' });
        }

        // Validate each character has required fields
        for (const char of parsedCharacters) {
            if (!char.key || !char.name || typeof char.x !== 'number' || typeof char.y !== 'number') {
                return res.status(400).json({
                    error: 'Each character must have key, name, x, and y properties'
                });
            }
        }

        // Generate unique filename for map
        const timestamp = Date.now();
        const mapFilename = `maps/${timestamp}-${mapImageFile.originalname}`;

        // Upload map image to Supabase storage
        const { data: mapUploadData, error: mapUploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(mapFilename, mapImageFile.buffer, {
                contentType: mapImageFile.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (mapUploadError) {
            console.error('Supabase map upload error:', mapUploadError);
            return res.status(500).json({ error: 'Failed to upload map image to storage' });
        }

        // Get public URL for map
        const { data: { publicUrl: mapPublicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(mapFilename);

        // Upload character images and map to characters
        const characterImageMap = {};
        for (let i = 0; i < characterImageFiles.length; i++) {
            const charFile = characterImageFiles[i];
            const charFilename = `characters/${timestamp}-${i}-${charFile.originalname}`;

            const { error: charUploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(charFilename, charFile.buffer, {
                    contentType: charFile.mimetype,
                    cacheControl: '3600',
                    upsert: false
                });

            if (!charUploadError) {
                const { data: { publicUrl: charPublicUrl } } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(charFilename);
                characterImageMap[i] = charPublicUrl;
            }
        }

        // Create map in database with character images
        const map = await prisma.map.create({
            data: {
                name: mapName,
                url: mapPublicUrl,
                characters: {
                    create: parsedCharacters.map((char, index) => ({
                        key: char.key,
                        name: char.name,
                        x: char.x,
                        y: char.y,
                        imageUrl: characterImageMap[index] || null
                    }))
                }
            },
            include: {
                characters: true
            }
        });

        return res.status(201).json({
            message: 'Map uploaded successfully',
            map
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'Failed to upload map' });
    }
};
