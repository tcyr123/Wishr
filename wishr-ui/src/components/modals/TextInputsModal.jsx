import { preventDefault } from '../../constants';
import './TextInputsModal.css';
function TextInputsModal({
    headline,
    inputSections = [],
    buttons = [],
    onOverlayClick
}) {
    return (
        <div className="modal-overlay fade-in" onClick={onOverlayClick}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="entry-form">
                    <h2>{headline}</h2>
                    <form onSubmit={preventDefault}>
                        {inputSections.map((section, index) => (
                            <div key={index} className="input-box">
                                <label htmlFor={section.id}>{section.labelValue}:</label>
                                <input
                                    //focus first input except on checkboxes
                                    autoFocus={section.inputType != "checkbox" && index === 0}
                                    type={section.inputType}
                                    checked={section.value || false}
                                    id={section.id}
                                    disabled={section.disabled || false}
                                    list={section.labelValue}
                                    autoComplete="off"
                                    value={section.value || ''}
                                    placeholder={section.placeholder}
                                    onKeyDown={(e) => section.onKeyDown && section.onKeyDown(e)}
                                    onChange={(e) => section.onChange && section.onChange(e)}
                                />

                                {section.textList ?
                                    <datalist id={section.labelValue}>
                                        {section.textList.map((option) =>
                                            <option key={option}>{option}</option>
                                        )}
                                    </datalist> : null
                                }
                            </div>
                        ))
                        }
                    </form >
                    <div className="btn-box">
                        {buttons.map((button, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.preventDefault();
                                    button.callbackFunction();
                                }}
                                className={button.className}
                            >
                                {button.title}
                            </button>
                        ))}
                    </div>
                </div >
            </div>
        </div>
    );
}

export default TextInputsModal