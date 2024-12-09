export default function TextInputsModal({ headline, inputSections = [], buttons = [] }) {
    return (
        <div className="entry-form unroll">
            <h2>{headline}</h2>
            <form>
                {inputSections.map((section, index) => (
                    <div key={index} className="input-box">
                        <label htmlFor={section.id}>{section.labelValue}:</label>
                        <input
                            type={section.inputType}
                            id={section.id}
                            list={section.labelValue}
                            autoComplete="off"
                            value={section.value || ''}
                            placeholder={section.placeholder}
                            onChange={(e) => section.onChange(e)}
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
            </form >
        </div >
    );
}
