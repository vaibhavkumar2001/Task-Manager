import { create } from "zustand"
import noteService from "../api/noteService"

const useNoteStore = create((set,get) => ({
    notes: [],
    currentNote: null,
    isLoading: false,
    error: null,
    projectId: null, // track the current projectId

    //fetch the notes for a project
    fetchNotes: async (projectId) => {
        //Skip if we don't have a valid project Id
        if(!projectId) {
            return get().notes
        }
        //Acha yeh yahan ek validation kiya h 
        //jaise backend mein hoti h authentication
        
        //if we're already showing notes for this project,don't fetch again
        //unless the notes array is empty
        if(get().projectId === projectId && get().notes.length > 0) {
            return get().notes
            // Matlab: agar hum already same project ke notes load kar chuke hain aur notes array khaali nahi hai, toh dobara API call mat karo → directly get() se store ka notes data return kar do.
        }

        //only set loading state if we're actually making a network request
        set( { isLoading: true,error: null});
        try {
            const response = await noteService.getNotes(projectId)
            set({notes: response.data,
                projectId: projectId,
                isLoading: false,
            })
            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message ||
                "Failed to fetch notes",
            })
            throw error;
        }
    },
    //Get the notes by ID
    fetchNotById: async (projectId,noteId) => {
        set({ isLoading: true, error: null})
        try {
            const response = await noteService.getNoteById(projectId,noteId);
            set({
                currentNote: response.data,
                isLoading: false,
            })
        } catch (error) {
            
        }
    }
}))