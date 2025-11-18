import { useState, useRef } from "react";

export function useImageClick() {
    const [clickCoords, setClickCoords] = useState(null);       // {x%, y%}
    const [menuPosition, setMenuPosition] = useState(null);     // pixel-based for UI
    const imgRef = useRef(null);

    function handleImageClick(e) {
        const img = imgRef.current;
        if (!img) return;

        const rect = img.getBoundingClientRect();

        // pixel position for dropdown placement
        const menuX = e.clientX - rect.left;
        const menuY = e.clientY - rect.top;
        setMenuPosition({ x: menuX, y: menuY });

        // percent-based position for hit detection
        const percentX = menuX / rect.width;
        const percentY = menuY / rect.height;

        setClickCoords({ x: percentX, y: percentY });
    }

    function clearClick() {
        setClickCoords(null);
        setMenuPosition(null);
    }

    return {
        imgRef,
        clickCoords,
        menuPosition,
        handleImageClick,
        clearClick
    };
}
