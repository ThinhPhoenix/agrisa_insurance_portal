import { Input } from 'antd';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

//  Debounced Input Component for Vietnamese IME fix
const DebouncedTextArea = memo(({ value: initialValue, onChange, ...props }) => {
    const [localValue, setLocalValue] = useState(initialValue || '');
    const timeoutRef = useRef(null);

    // Sync local state when initialValue changes from parent
    useEffect(() => {
        setLocalValue(initialValue || '');
    }, [initialValue]);

    // Handle input with debounce
    const handleChange = useCallback((e) => {
        const newValue = e.target.value;
        setLocalValue(newValue); // Update local immediately for smooth typing

        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce parent update
        timeoutRef.current = setTimeout(() => {
            onChange?.(e);
        }, 300);
    }, [onChange]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <Input.TextArea
            {...props}
            value={localValue}
            onChange={handleChange}
        />
    );
});

DebouncedTextArea.displayName = 'DebouncedTextArea';

export default DebouncedTextArea;
