// NumericKeypad.js
import React from 'react';
import './NumericKeypad.css'; // Create this CSS file for styling

const KeypadButton = React.memo(({ digit, onPress, disabled }) => (
    <button 
        className={`keypad-btn ${disabled ? 'disabled' : ''}`}
        onClick={() => onPress(digit)}
        disabled={disabled}
        aria-label={`Press ${digit}`}
    >
        {digit}
    </button>
));

const NumericKeypad = React.memo(({ onKeyPress, disabled }) => {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

    return (
        <div className="numeric-keypad-container">
            <div className="numeric-keypad">
                {digits.map(digit => (
                    <KeypadButton 
                        key={digit} 
                        digit={digit} 
                        onPress={onKeyPress}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
});

export default NumericKeypad;
