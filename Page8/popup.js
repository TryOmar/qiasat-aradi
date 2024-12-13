// First, add this CSS to your stylesheet
const style = document.createElement('style');
style.textContent = `
.dark-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s, visibility 0.3s;
    z-index: 1000;
}

.dark-popup-overlay.active {
    opacity: 1;
    visibility: visible;
}

.dark-popup {
    background-color: #1a1a1a;
    color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
    max-width: 400px;
    width: 90%;
    transform: scale(0.9);
    transition: transform 0.3s;
}

.dark-popup.active {
    transform: scale(1);
}

.dark-popup-close {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 5px;
    font-size: 20px;
    line-height: 1;
    transition: color 0.3s;
}

.dark-popup-close:hover {
    color: white;
}

.dark-popup-content {
    margin-top: 10px;
    font-size: 16px;
    line-height: 1.5;
}
`;
document.head.appendChild(style);

// The popup function
export function showPopup(text) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'dark-popup-overlay';
    
    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'dark-popup';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'dark-popup-close';
    closeButton.innerHTML = '×';
    
    // Create content
    const content = document.createElement('div');
    content.className = 'dark-popup-content';
    content.textContent = text;
    
    // Assemble popup
    popup.appendChild(closeButton);
    popup.appendChild(content);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Trigger animation
    requestAnimationFrame(() => {
        overlay.classList.add('active');
        popup.classList.add('active');
    });
    
    // Handle closing
    function closePopup() {
        overlay.classList.remove('active');
        popup.classList.remove('active');
        
        // Remove elements after animation
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    }
    
    closeButton.addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePopup();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closePopup();
        }
    });
}
