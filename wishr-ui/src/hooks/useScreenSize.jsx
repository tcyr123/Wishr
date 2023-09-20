import { useEffect, useState } from 'react';

function useScreenSize() {
    const [screenSize, setScreenSize] = useState('default');

    useEffect(() => {
        function handleResize() {
            const screenWidth = window.innerWidth;
            if (screenWidth <= 767) {
                setScreenSize('mobile');
            } else if (screenWidth >= 768 && screenWidth <= 1023) {
                setScreenSize('tablet');
            } else {
                setScreenSize('desktop');
            }
        }

        // Attach the event listener
        window.addEventListener('resize', handleResize);

        // Initial screen size detection
        handleResize();

        // Cleanup the event listener when the hook unmounts
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return screenSize;
}

export default useScreenSize;
