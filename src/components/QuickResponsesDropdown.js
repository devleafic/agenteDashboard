import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './QuickResponsesDropdown.css';

const QuickResponsesDropdown = ({
  options = [],
  visible = false,
  top = 0,
  left = 0,
  selectedIndex = 0,
  onSelect,
  onHover,
  onClose
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (visible && dropdownRef.current) {
      dropdownRef.current.scrollTop = selectedIndex * 36;
    }
  }, [selectedIndex, visible]);

  if (!visible || options.length === 0) return null;

  return (
    <div
      className="quick-responses-dropdown"
      ref={dropdownRef}
      style={{ top, left, position: 'absolute', zIndex: 1000 }}
      role="listbox"
      tabIndex={-1}
    >
      {options.map((option, idx) => (
        <div
          key={option.id || idx}
          className={
            'quick-response-option' + (idx === selectedIndex ? ' selected' : '')
          }
          role="option"
          aria-selected={idx === selectedIndex}
          onMouseDown={e => {
            e.preventDefault();
            onSelect(option);
          }}
          onMouseEnter={() => onHover(idx)}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
};

QuickResponsesDropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string.isRequired, id: PropTypes.any })
  ),
  visible: PropTypes.bool,
  top: PropTypes.number,
  left: PropTypes.number,
  selectedIndex: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
  onHover: PropTypes.func.isRequired,
  onClose: PropTypes.func
};

export default QuickResponsesDropdown;
