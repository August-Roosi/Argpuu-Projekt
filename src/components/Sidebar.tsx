import React, { useState, useEffect } from 'react';
import { GiSettingsKnobs } from "react-icons/gi";
import { AiTwotoneBook } from "react-icons/ai";
import { getCSRFToken } from '../utils/getCSRFToken';
import toast from 'react-hot-toast';
import EditIcon from '@mui/icons-material/Edit';
import EditOffIcon from '@mui/icons-material/EditOff';


interface UserType {
    id: number;
    username: string;
}

interface SidebarProps {
    title: string;
    author: string;
    argumentMapId: string;
    isAuthor?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ title, author, argumentMapId, isAuthor }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [whatIsOpen, setWhatIsOpen] = useState("Omadused");
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
    const [editors, setEditors] = useState<UserType[]>([]);
    const [viewers, setViewers] = useState<UserType[]>([]);


    console.log(title, author, argumentMapId)
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const csrfToken = getCSRFToken();
                const response = await fetch('/api/users/', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken || '',
                    },
                    credentials: 'include',
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                setAllUsers(data);
            } catch (error) {
                console.error("Failed to fetch users:", error);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredUsers([]);
        } else {
            const excludedUsernames = new Set([
                ...viewers.map(user => user.username),
                ...editors.map(user => user.username),
            ]);

            setFilteredUsers(
                allUsers.filter(user =>
                    !excludedUsernames.has(user.username) &&
                    user.username.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
    }, [searchTerm, allUsers, viewers, editors]);

    const fetchEditors = async () => {
        try {
            const csrfToken = getCSRFToken();
            const response = await fetch('/get_editors/'+argumentMapId+"/", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken || '',
                },
                credentials: 'include',
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            setEditors(data.editors);
        } catch (error) {
            console.error("Failed to fetch editors:", error);
        }
    };
    const fetchViewers = async () => {
        try {
            const csrfToken = getCSRFToken();
            const response = await fetch('/get_viewers/'+argumentMapId+"/", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken || '',
                },
                credentials: 'include',
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            setViewers(data.viewers);
        } catch (error) {
            console.error("Failed to fetch viewers:", error);
        }
    };

    useEffect(() => {
        fetchEditors();
        fetchViewers();

    }, []);

    const addEditorPath = "add_editor";
    const addViewerPath = "add_viewer";
    const removeEditorPath = "remove_editor";
    const removeViewerPath = "remove_viewer";

    const handleModifyRights = async (userId: number, path: string) => {
        if (!isAuthor) {
            toast.error("Ainult kaardi autor saab muuta kasutajate õigusi.");
            return;
        }
        try {
            const csrfToken = getCSRFToken();
            const response = await fetch("/"+path+`/${argumentMapId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken || '',
                },
                credentials: 'include',
                body: JSON.stringify({ user_id: userId }),
            });

            if (!response.ok) {
                throw new Error(`Failed to add editor: ${response.status}`);
            }

            toast.success("Muutsid edukalt kasutaja õigusi!");

            fetchEditors();
            fetchViewers();
        
            setSearchTerm("");
            setFilteredUsers([]);
        } catch (error) {
            console.error("Error adding editor:", error);
            toast.error("Kasutaja õiguste muutmisel tekkis viga.");
        }
    };

    return (
        <>
            <div
                className="fixed top-1/2 right-0 z-50 w-3 h-16 bg-gray-600 cursor-pointer flex items-center justify-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="text-white text-xs rotate-90">info</div>
            </div>

            <div
                className={`fixed top-0 right-0 h-full w-[30%] max-w-sm bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-row">
                    <button
                        className={`w-1/2 py-2 ${whatIsOpen !== "Omadused" ? "bg-gray-200" : ""}`}
                        onClick={() => setWhatIsOpen("Omadused")}
                    >
                        <GiSettingsKnobs className="mx-auto" />
                        <div>Omadused</div>
                    </button>
                    <button
                        className={`w-1/2 py-2 ${whatIsOpen !== "Sõnastik" ? "bg-gray-200" : ""}`}
                        onClick={() => setWhatIsOpen("Sõnastik")}
                    >
                        <AiTwotoneBook className="mx-auto" />
                        <div>Sõnastik</div>
                    </button>
                </div>

                {whatIsOpen === "Omadused" && (
                    <div className="p-4 space-y-4">
                        <p className="text-sm text-gray-600">Kaardi omadused ja seaded.</p>
                        { isAuthor ? (
                        <div>
                            <label className="block mb-1 text-sm font-medium">Lisa vaataja:</label>
                            <input
                                type="text"
                                placeholder="Otsi kasutajat..."
                                className="w-full border px-3 py-1 rounded"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {filteredUsers.length > 0 && (
                                <ul className="mt-2 border rounded shadow max-h-40 overflow-auto">
                                    {filteredUsers.map(user => (
                                        <li
                                            key={user.id}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => handleModifyRights(user.id, addViewerPath)}
                                        >
                                            {user.username}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>):<></>}

                        <div>
                            {viewers.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-medium mb-2">Vaatajad:</h3>
                                    <ul className="space-y-1">
                                        {viewers.map((user: UserType) => (
                                            <li
                                                key={user.id}
                                                className="flex justify-between items-center px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"
                                            >
                                                <span>{user.username}</span>
                                                {isAuthor ? (
                                                <div className="flex flex-row-reverse gap-2">  
                                                    {editors.some(editor => editor.id === user.id) ? (
                                                        <button onClick={() => handleModifyRights(user.id, removeEditorPath)}>
                                                            <EditIcon />
                                                        </button>):(
                                                        <button onClick={() => handleModifyRights(user.id, addEditorPath)}>
                                                            <EditOffIcon />
                                                        </button>)
                                                    }


                                                    <button
                                                        className="text-red-500 hover:text-red-700"
                                                        onClick={() => handleModifyRights(user.id, removeViewerPath)}
                                                    >
                                                        Eemalda
                                                    </button>
                                                </div>):<></>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}  
                        </div>
                    </div>
                )}

                {whatIsOpen === "Sõnastik" && (
                    <div className="p-4">
                        <p className="text-sm text-gray-600">Kaardi sõnastik ja seletused.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default Sidebar;
