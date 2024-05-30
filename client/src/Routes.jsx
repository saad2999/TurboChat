import { useContext } from "react";
import RegisterandLoginform from "./RegisterandLoginform"
import { userContext } from "./usercontext";
import Chat from "./Chat";

export default function Routes() {
    const {username,id}=useContext(userContext)
    if(username)
     {
        return <Chat/>
    }

    return (
        <RegisterandLoginform/>
    );
}