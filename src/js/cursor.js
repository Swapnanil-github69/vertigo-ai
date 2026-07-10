(function () {
    // Check if desktop device and supports fine pointer inputs
    const isTouch = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);
    const isDesktop = window.innerWidth >= 768 && !isTouch;
    
    if (!isDesktop) return; // Fallback to default system cursor

    // Check prefers-reduced-motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Create the custom cursor DOM elements
    const cursorContainer = document.createElement('div');
    cursorContainer.id = 'custom-cursor';
    cursorContainer.className = 'custom-cursor';

    // SVG paths
    const PATHS = {
        pointer: '<path class="cursor-path" d="M0,0 L0,20 L5.5,15 L10.5,24.5 L12.5,23.5 L7.5,14.5 L14.5,14.5 Z"></path>',
        ibeam: '<path class="cursor-path" d="M3,1 C3,0.45 3.45,0 4,0 L10,0 C10.55,0 11,0.45 11,1 C11,1.55 10.55,2 10,2 L8,2 L8,16 L10,16 C10.55,16 11,16.45 11,17 C11,17.55 10.55,18 10,18 L4,18 C3.45,18 3,17.45 3,17 C3,16.45 3.45,16 4,16 L6,16 L6,2 L4,2 C3.45,2 3,1.55 3,1 Z"></path>',
        grabbing: '<path class="cursor-path" d="M11.5,5 C10.7,5 10,5.7 10,6.5 L10,9 C9.7,8.7 9.4,8.5 9,8.5 C8.2,8.5 7.5,9.2 7.5,10 L7.5,10.5 C7.2,10.2 6.9,10 6.5,10 C5.7,10 5,10.7 5,11.5 L5,12 C4.7,11.7 4.4,11.5 4,11.5 C3.2,11.5 2.5,12.2 2.5,13 L2.5,15.5 C2.5,18 4.5,20 7,20 L9.5,20 C12,20 14,18 14,15.5 L14,7.5 C14,6.7 13.3,6 12.5,6 C12.3,6 12.1,6.1 11.9,6.2 C11.7,5.5 11.1,5 10.4,5 Z"></path>'
    };

    cursorContainer.innerHTML = `
        <svg viewBox="0 0 32 32" id="custom-cursor-svg">
            ${PATHS.pointer}
        </svg>
        <div class="custom-cursor-spinner"></div>
    `;

    document.body.appendChild(cursorContainer);
    
    // Enable custom cursor styles
    document.documentElement.classList.add('custom-cursor-enabled');

    const svgElement = document.getElementById('custom-cursor-svg');

    // State variables
    let mouse = { x: -100, y: -100 };
    let cursor = { x: -100, y: -100 };
    let firstMove = true;
    let isClicking = false;
    let isDragging = false;
    let currentShape = 'pointer'; // 'pointer', 'ibeam', 'grabbing'
    let currentHoverState = 'none'; // 'none', 'button', 'link'
    let isLoading = false;

    // Mouse coordinates tracking
    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if (firstMove) {
            cursor.x = mouse.x;
            cursor.y = mouse.y;
            firstMove = false;
        }
    });

    // Handle cursor entry and exit of the document window
    document.addEventListener('mouseenter', () => {
        cursorContainer.style.opacity = '1';
    });
    document.addEventListener('mouseleave', () => {
        cursorContainer.style.opacity = '0';
    });

    // Click behavior (tactile compression)
    document.addEventListener('mousedown', (e) => {
        isClicking = true;
        updateClasses();
        
        // If clicking on drag triggers (like canvas charts, range inputs, sliders)
        const target = e.target;
        if (target.closest('canvas') || target.closest('input[type="range"]') || target.closest('.draggable') || target.closest('.slider')) {
            isDragging = true;
            updateShape('grabbing');
        }
    });

    document.addEventListener('mouseup', () => {
        isClicking = false;
        isDragging = false;
        
        // Return shape to whatever is currently hovered
        const hovered = document.querySelector(':hover');
        if (hovered) {
            handleElementHover(hovered);
        } else {
            updateShape('pointer');
            currentHoverState = 'none';
        }
        updateClasses();
    });

    // Hover state management
    function handleElementHover(target) {
        if (!target) return;
        
        // 1. Text Fields (I-beam)
        const isInputField = target.tagName === 'INPUT' && ['text', 'email', 'password', 'search', 'number', 'tel', 'url'].includes(target.type);
        const isTextArea = target.tagName === 'TEXTAREA';
        const isContentEditable = target.hasAttribute('contenteditable') || target.closest('[contenteditable]');
        
        if ((isInputField || isTextArea || isContentEditable) && !target.disabled && !target.readOnly) {
            updateShape('ibeam');
            currentHoverState = 'none';
            return;
        }

        // 2. Clickable / Interactive Buttons and Cards (Blue Glow)
        const isButton = target.tagName === 'BUTTON' || target.closest('button') || target.getAttribute('role') === 'button' || target.closest('[role="button"]') || target.classList.contains('btn') || target.closest('.btn');
        const isInteractiveCard = target.classList.contains('glass-panel-interactive') || target.closest('.glass-panel-interactive');
        const isSidebarItem = target.classList.contains('nav-sidebar-link') || target.closest('.nav-sidebar-link');
        const isDropdown = target.tagName === 'SELECT' || target.closest('select');
        const isIcon = target.classList.contains('material-symbols-outlined') || target.closest('.material-symbols-outlined');
        const isChart = target.tagName === 'CANVAS' || target.closest('.chart-container') || target.closest('canvas');
        const isTableRow = target.tagName === 'TR' || target.closest('tr');
        const hasOnClick = target.hasAttribute('onclick') || target.closest('[onclick]');

        if (isButton || isInteractiveCard || isSidebarItem || isDropdown || isIcon || isChart || isTableRow || hasOnClick) {
            updateShape('pointer');
            currentHoverState = 'button';
            return;
        }

        // 3. Links (Scale & Shadow)
        const isLink = target.tagName === 'A' || target.closest('a');
        if (isLink) {
            updateShape('pointer');
            currentHoverState = 'link';
            return;
        }

        // Default Pointer
        updateShape('pointer');
        currentHoverState = 'none';
    }

    // Monitor hover elements via event delegation
    document.addEventListener('mouseover', (e) => {
        if (isDragging) return;
        handleElementHover(e.target);
        updateClasses();
    });

    document.addEventListener('mouseout', (e) => {
        if (isDragging) return;
        // If transitioning away, reset
        updateShape('pointer');
        currentHoverState = 'none';
        updateClasses();
    });

    // Monitor application loading states from the global state if available
    setInterval(() => {
        const isGlobalStateLoading = window.state && window.state.loading;
        const spinnerExists = document.querySelector('.spinner, .animate-spin, .loading');
        const nextLoading = !!(isGlobalStateLoading || spinnerExists);
        if (nextLoading !== isLoading) {
            isLoading = nextLoading;
            updateClasses();
        }
    }, 250);

    // Update classes based on active state
    function updateClasses() {
        // Reset classes
        cursorContainer.classList.remove('state-ibeam', 'state-grabbing', 'state-hovering', 'state-clicking', 'state-link-hovering', 'state-loading');

        if (currentShape === 'ibeam') {
            cursorContainer.classList.add('state-ibeam');
        } else if (currentShape === 'grabbing') {
            cursorContainer.classList.add('state-grabbing');
        }

        if (isClicking) {
            cursorContainer.classList.add('state-clicking');
        } else if (currentHoverState === 'button') {
            cursorContainer.classList.add('state-hovering');
        } else if (currentHoverState === 'link') {
            cursorContainer.classList.add('state-link-hovering');
        }

        if (isLoading) {
            cursorContainer.classList.add('state-loading');
        }
    }

    // Update shape SVG path
    function updateShape(shape) {
        if (currentShape === shape) return;
        currentShape = shape;
        svgElement.innerHTML = PATHS[shape];
    }

    // Animation Loop
    function render() {
        // Linear Interpolation (lerp)
        const speed = reducedMotion ? 1 : 0.18;
        
        cursor.x = cursor.x + (mouse.x - cursor.x) * speed;
        cursor.y = cursor.y + (mouse.y - cursor.y) * speed;

        // Apply hotspot offsets based on active shape
        let offsetX = 0;
        let offsetY = 0;
        if (currentShape === 'ibeam') {
            offsetX = 7;
            offsetY = 9;
        } else if (currentShape === 'grabbing') {
            offsetX = 8;
            offsetY = 12;
        }

        cursorContainer.style.transform = `translate3d(${cursor.x - offsetX}px, ${cursor.y - offsetY}px, 0)`;

        requestAnimationFrame(render);
    }

    // Start render loop
    requestAnimationFrame(render);
})();
