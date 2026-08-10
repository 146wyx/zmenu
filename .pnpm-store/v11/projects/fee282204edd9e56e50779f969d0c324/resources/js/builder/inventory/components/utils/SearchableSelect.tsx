import { useState, useEffect, useRef } from 'react';
import { Dropdown, Form } from 'react-bootstrap';

const SearchableSelect = ({ options, handleChange, name, defaultValue = '', displayOption = (option) => option, allowCustom = true }) => {
    const optionLabel = (option) => String(displayOption(option));
    const [searchTerm, setSearchTerm] = useState(optionLabel(defaultValue ?? ''));
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setSearchTerm(optionLabel(defaultValue ?? ''));
    }, [defaultValue]);

    const handleClick = (option) => {
        setSearchTerm(optionLabel(option));
        handleChange({
            target: { type: 'text', name: name, value: option, checked: false },
        });
        setShowDropdown(false);
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
        setShowDropdown(event.target.value !== '');
        if (allowCustom) handleChange(event);
    };

    const filteredOptions = options.filter((option) => {
        const normalizedSearchTerm = searchTerm.toLowerCase();
        return String(option).toLowerCase().includes(normalizedSearchTerm)
            || optionLabel(option).toLowerCase().includes(normalizedSearchTerm);
    });

    const handleBlur = (event) => {
        if (!wrapperRef.current.contains(event.relatedTarget)) {
            setShowDropdown(false);
        }
    };

    return (
        <div ref={wrapperRef} onBlur={handleBlur}>
            <Form.Control
                className={'rounded-1'}
                name={name}
                type="text"
                placeholder="搜索..."
                value={searchTerm}
                onChange={handleSearch}
                onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && (
                <Dropdown.Menu show style={{ maxHeight: '300px', overflowY: 'auto', maxWidth: '460px', overflowX: 'hidden' }} variant={'dark'}>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <Dropdown.Item key={index} onClick={() => handleClick(option)}>
                                {optionLabel(option)}
                            </Dropdown.Item>
                        ))
                    ) : (
                        <Dropdown.Item disabled>未找到选项</Dropdown.Item>
                    )}
                </Dropdown.Menu>
            )}
        </div>
    );
};

export default SearchableSelect;
