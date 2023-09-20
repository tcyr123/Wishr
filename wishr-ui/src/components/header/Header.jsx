import { useScreenSizeContext } from "../../contexts/ScreenSizeContext";
import "./Header.css";

export default function Header() {
    const screenSize = useScreenSizeContext();

    return (
        <div className="header">
            <h1>Header Here. Size is: {screenSize} </h1>
        </div>
    )
}