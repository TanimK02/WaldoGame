import { useState } from 'react';
import styles from './AdminUpload.module.css';

export default function AdminUpload() {
    const [adminCode, setAdminCode] = useState('');
    const [mapName, setMapName] = useState('');
    const [mapImage, setMapImage] = useState(null);
    const [characters, setCharacters] = useState([{ key: '', name: '', x: 0, y: 0, image: null, imagePreview: null }]);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [activeCharacter, setActiveCharacter] = useState(0);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMapImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCharacterChange = (index, field, value) => {
        const updated = [...characters];
        updated[index][field] = field === 'x' || field === 'y' ? parseFloat(value) : value;
        setCharacters(updated);
    };

    const handleCharacterImageChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const updated = [...characters];
            updated[index].image = file;
            updated[index].imagePreview = URL.createObjectURL(file);
            setCharacters(updated);
        }
    };

    const addCharacter = () => {
        setCharacters([...characters, { key: '', name: '', x: 0, y: 0, image: null, imagePreview: null }]);
    };

    const removeCharacter = (index) => {
        if (characters.length > 1) {
            setCharacters(characters.filter((_, i) => i !== index));
        }
    };

    const handleMapClick = (e) => {
        if (!previewUrl) return;

        const rect = e.target.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // Update the active character's coordinates
        const updated = [...characters];
        updated[activeCharacter].x = Math.round(x * 100) / 100;
        updated[activeCharacter].y = Math.round(y * 100) / 100;
        setCharacters(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('mapImage', mapImage);
            formData.append('mapName', mapName);
            formData.append('adminCode', adminCode);

            // Add character data without images
            const characterData = characters.map(({ image, imagePreview, ...char }) => char);
            formData.append('characters', JSON.stringify(characterData));

            // Add character images
            characters.forEach((char) => {
                if (char.image) {
                    formData.append('characterImages', char.image);
                }
            });

            const res = await fetch('https://waldogame-production.up.railway.app/api/admin/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Map uploaded successfully!' });
                // Reset form
                setMapName('');
                setMapImage(null);
                setPreviewUrl(null);
                setCharacters([{ key: '', name: '', x: 0, y: 0, image: null, imagePreview: null }]);
            } else {
                setMessage({ type: 'error', text: data.error || 'Upload failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1>Admin: Upload Map</h1>

            {message && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label>Admin Code *</label>
                    <input
                        type="password"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        required
                        placeholder="Enter secret admin code"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Map Name *</label>
                    <input
                        type="text"
                        value={mapName}
                        onChange={(e) => setMapName(e.target.value)}
                        required
                        placeholder="e.g., Beach Scene"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Map Image *</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        required
                    />
                    {previewUrl && (
                        <div className={styles.previewSection}>
                            <p className={styles.clickHint}>Click on the image to set coordinates for <strong>Character {activeCharacter + 1}</strong></p>
                            <div className={styles.preview}>
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    onClick={handleMapClick}
                                    style={{ cursor: 'crosshair' }}
                                />
                                {characters.map((char, idx) => {
                                    if (char.x === 0 && char.y === 0) return null;
                                    return (
                                        <div
                                            key={idx}
                                            className={`${styles.marker} ${idx === activeCharacter ? styles.activeMarker : ''}`}
                                            style={{
                                                left: `${char.x * 100}%`,
                                                top: `${char.y * 100}%`
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveCharacter(idx);
                                            }}
                                        >
                                            {idx + 1}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.charactersSection}>
                    <h3>Characters</h3>
                    <p className={styles.hint}>Coordinates should be between 0 and 1 (e.g., 0.5 for center)</p>

                    {characters.map((char, index) => (
                        <div
                            key={index}
                            className={`${styles.characterCard} ${index === activeCharacter ? styles.activeCard : ''}`}
                            onClick={() => setActiveCharacter(index)}
                        >
                            <div className={styles.characterHeader}>
                                <h4>Character {index + 1}</h4>
                                {characters.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeCharacter(index)}
                                        className={styles.removeBtn}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <div className={styles.characterFields}>
                                <input
                                    type="text"
                                    placeholder="Key (e.g., waldo)"
                                    value={char.key}
                                    onChange={(e) => handleCharacterChange(index, 'key', e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Name (e.g., Waldo)"
                                    value={char.name}
                                    onChange={(e) => handleCharacterChange(index, 'name', e.target.value)}
                                    required
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    placeholder="X (0-1)"
                                    value={char.x}
                                    onChange={(e) => handleCharacterChange(index, 'x', e.target.value)}
                                    required
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    placeholder="Y (0-1)"
                                    value={char.y}
                                    onChange={(e) => handleCharacterChange(index, 'y', e.target.value)}
                                    required
                                />
                            </div>

                            <div className={styles.characterImageSection}>
                                <label>Character Image (optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleCharacterImageChange(index, e)}
                                />
                                {char.imagePreview && (
                                    <div className={styles.charPreview}>
                                        <img src={char.imagePreview} alt={`${char.name} preview`} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addCharacter}
                        className={styles.addBtn}
                    >
                        + Add Character
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={styles.submitBtn}
                >
                    {loading ? 'Uploading...' : 'Upload Map'}
                </button>
            </form>
        </div>
    );
}
